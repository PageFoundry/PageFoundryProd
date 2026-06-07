import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { generateServiceInvoicePDF } from "@/lib/invoice";

const invoiceInclude = {
  client: true,
  items: { include: { service: true }, orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { paidAt: "desc" as const } },
};

export type HqInvoice = Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>;

export function parseCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value !== "string") return 0;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function calculateLine(quantity: number, unitPriceCents: number, taxRateBps: number) {
  const lineNetCents = quantity * unitPriceCents;
  const lineTaxCents = Math.round((lineNetCents * taxRateBps) / 10000);
  return {
    lineNetCents,
    lineTaxCents,
    lineGrossCents: lineNetCents + lineTaxCents,
  };
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient, issueDate: Date) {
  const year = issueDate.getFullYear();
  const prefix = `PF-${year}-`;
  const latest = await tx.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const latestSeq = latest?.number ? Number(latest.number.slice(prefix.length)) : 0;
  return `${prefix}${String((Number.isFinite(latestSeq) ? latestSeq : 0) + 1).padStart(3, "0")}`;
}

export async function getPagefoundryHqSnapshot() {
  const now = new Date();
  const [clients, services, activeClientServices, invoices] = await Promise.all([
    prisma.businessClient.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        services: { include: { service: true }, orderBy: { updatedAt: "desc" } },
        invoices: { orderBy: { issueDate: "desc" }, take: 5 },
      },
    }),
    prisma.serviceOffering.findMany({
      orderBy: [{ isActive: "desc" }, { billingMode: "asc" }, { name: "asc" }],
    }),
    prisma.clientService.findMany({
      where: { status: "ACTIVE" },
      include: { client: true, service: true },
      orderBy: { nextInvoiceDate: "asc" },
    }),
    prisma.invoice.findMany({
      include: invoiceInclude,
      orderBy: { issueDate: "desc" },
      take: 100,
    }),
  ]);

  const openInvoices = invoices.filter((invoice) => invoice.status === "SENT" || invoice.status === "OVERDUE");
  const overdueInvoices = openInvoices.filter((invoice) => invoice.dueDate < now);
  const paidThisMonth = invoices.filter((invoice) => {
    if (invoice.status !== "PAID" || !invoice.paidAt) return false;
    return invoice.paidAt.getUTCFullYear() === now.getUTCFullYear() && invoice.paidAt.getUTCMonth() === now.getUTCMonth();
  });
  const mrrCents = activeClientServices.reduce((sum, item) => {
    if (item.billingInterval !== "monthly") return sum;
    const net = item.quantity * item.unitPriceCents;
    const tax = Math.round((net * item.taxRateBps) / 10000);
    return sum + net + tax;
  }, 0);

  return {
    generatedAt: now,
    clients,
    services,
    activeClientServices,
    invoices,
    summary: {
      clientCount: clients.length,
      activeClientCount: clients.filter((client) => client.status === "ACTIVE").length,
      invoiceCount: invoices.length,
      openInvoiceCents: openInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0),
      overdueInvoiceCents: overdueInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0),
      paidThisMonthCents: paidThisMonth.reduce((sum, invoice) => sum + invoice.totalCents, 0),
      mrrCents,
    },
  };
}

export async function createBusinessClient(input: Record<string, unknown>) {
  const name = cleanString(input.name);
  if (!name) throw new Error("client_name_required");

  return prisma.businessClient.create({
    data: {
      name,
      companyName: cleanString(input.companyName),
      status: input.status === "LEAD" ? "LEAD" : "ACTIVE",
      email: cleanString(input.email),
      phone: cleanString(input.phone),
      website: cleanString(input.website),
      billingName: cleanString(input.billingName) ?? name,
      billingEmail: cleanString(input.billingEmail) ?? cleanString(input.email),
      billingAddressLine1: cleanString(input.billingAddressLine1),
      billingAddressLine2: cleanString(input.billingAddressLine2),
      postalCode: cleanString(input.postalCode),
      city: cleanString(input.city),
      country: cleanString(input.country) ?? "DE",
      vatId: cleanString(input.vatId),
      notes: cleanString(input.notes),
    },
  });
}

export async function createServiceOffering(input: Record<string, unknown>) {
  const name = cleanString(input.name);
  const unitPriceCents = parseCents(input.unitPrice);
  const taxRateBps = Math.round(Number(input.taxRate ?? 0) * 100);
  if (!name) throw new Error("service_name_required");
  if (unitPriceCents < 0) throw new Error("service_price_invalid");
  if (taxRateBps < 0 || taxRateBps > 10000) throw new Error("service_tax_invalid");

  return prisma.serviceOffering.create({
    data: {
      name,
      description: cleanString(input.description),
      unitPriceCents,
      taxRateBps,
      billingMode: input.billingMode === "RECURRING" ? "RECURRING" : "ONE_TIME",
      isActive: input.isActive !== false,
    },
  });
}

export async function createClientService(input: Record<string, unknown>) {
  const clientId = cleanString(input.clientId);
  const serviceId = cleanString(input.serviceId);
  if (!clientId) throw new Error("client_service_client_required");
  if (!serviceId) throw new Error("client_service_service_required");

  const service = await prisma.serviceOffering.findUniqueOrThrow({ where: { id: serviceId } });
  const quantity = Math.max(1, Math.round(Number(input.quantity ?? 1)));
  const unitPriceCents = cleanString(input.unitPrice) ? parseCents(input.unitPrice) : service.unitPriceCents;
  const taxRateBps = cleanString(input.taxRate) ? Math.round(Number(input.taxRate) * 100) : service.taxRateBps;
  if (unitPriceCents < 0) throw new Error("client_service_price_invalid");
  if (taxRateBps < 0 || taxRateBps > 10000) throw new Error("client_service_tax_invalid");

  const nextInvoiceDate = cleanString(input.nextInvoiceDate) ? new Date(String(input.nextInvoiceDate)) : undefined;
  if (nextInvoiceDate && Number.isNaN(nextInvoiceDate.getTime())) {
    throw new Error("client_service_date_invalid");
  }

  return prisma.clientService.create({
    data: {
      clientId,
      serviceId,
      title: cleanString(input.title) ?? service.name,
      quantity,
      unitPriceCents,
      taxRateBps,
      billingInterval: cleanString(input.billingInterval) ?? "monthly",
      nextInvoiceDate,
      notes: cleanString(input.notes),
    },
    include: { client: true, service: true },
  });
}

export async function createInvoice(input: Record<string, unknown>) {
  const clientId = cleanString(input.clientId);
  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (!clientId) throw new Error("invoice_client_required");
  if (rawItems.length === 0) throw new Error("invoice_items_required");

  const issueDate = cleanString(input.issueDate) ? new Date(String(input.issueDate)) : new Date();
  const dueDate = cleanString(input.dueDate) ? new Date(String(input.dueDate)) : addDays(issueDate, 14);
  if (Number.isNaN(issueDate.getTime()) || Number.isNaN(dueDate.getTime())) {
    throw new Error("invoice_date_invalid");
  }

  const items = rawItems.map((raw) => {
    const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const description = cleanString(item.description);
    const quantity = Math.max(1, Math.round(Number(item.quantity ?? 1)));
    const unitPriceCents = parseCents(item.unitPrice);
    const taxRateBps = Math.round(Number(item.taxRate ?? 0) * 100);
    if (!description) throw new Error("invoice_item_description_required");
    if (unitPriceCents < 0) throw new Error("invoice_item_price_invalid");
    if (taxRateBps < 0 || taxRateBps > 10000) throw new Error("invoice_item_tax_invalid");
    return {
      serviceId: cleanString(item.serviceId),
      description,
      quantity,
      unitPriceCents,
      taxRateBps,
      ...calculateLine(quantity, unitPriceCents, taxRateBps),
    };
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.lineNetCents, 0);
  const taxCents = items.reduce((sum, item) => sum + item.lineTaxCents, 0);
  const totalCents = items.reduce((sum, item) => sum + item.lineGrossCents, 0);

  return prisma.$transaction(async (tx) => {
    await tx.businessClient.findUniqueOrThrow({ where: { id: clientId } });
    const number = await nextInvoiceNumber(tx, issueDate);
    return tx.invoice.create({
      data: {
        number,
        clientId,
        issueDate,
        dueDate,
        servicePeriodStart: cleanString(input.servicePeriodStart)
          ? new Date(String(input.servicePeriodStart))
          : undefined,
        servicePeriodEnd: cleanString(input.servicePeriodEnd) ? new Date(String(input.servicePeriodEnd)) : undefined,
        notes: cleanString(input.notes),
        subtotalCents,
        taxCents,
        totalCents,
        items: {
          create: items,
        },
      },
      include: invoiceInclude,
    });
  });
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  if (!["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].includes(status)) {
    throw new Error("invoice_status_invalid");
  }

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { payments: true },
    });
    const paidCents = invoice.payments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const data: Prisma.InvoiceUpdateInput = { status: status as any };
    if (status === "SENT" && !invoice.sentAt) data.sentAt = new Date();
    if (status === "PAID") data.paidAt = invoice.paidAt ?? new Date();

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data,
      include: invoiceInclude,
    });

    if (status === "PAID" && paidCents < invoice.totalCents) {
      await tx.payment.create({
        data: {
          invoiceId,
          amountCents: invoice.totalCents - paidCents,
          method: "BANK_TRANSFER",
          reference: "Manuell markiert",
        },
      });
    }

    return updated;
  });
}

export async function getInvoiceForPdf(invoiceId: string) {
  return prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: invoiceInclude,
  });
}

export async function sendInvoiceEmail(invoiceId: string) {
  const invoice = await getInvoiceForPdf(invoiceId);
  const recipient = invoice.client.billingEmail ?? invoice.client.email;
  if (!recipient) throw new Error("invoice_recipient_missing");

  const pdf = await generateServiceInvoicePDF(invoice);
  await sendMail({
    to: recipient,
    subject: `Rechnung ${invoice.number} von Pagefoundry`,
    html: `<p>Hallo,</p><p>anbei die Rechnung ${invoice.number} von Pagefoundry.</p><p>Viele Gruesse<br />Pagefoundry</p>`,
    text: `Hallo,\n\nanbei die Rechnung ${invoice.number} von Pagefoundry.\n\nViele Gruesse\nPagefoundry`,
    attachments: [
      {
        filename: `${invoice.number}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: invoice.status === "DRAFT" ? "SENT" : invoice.status,
      sentAt: invoice.sentAt ?? new Date(),
    },
    include: invoiceInclude,
  });
}
