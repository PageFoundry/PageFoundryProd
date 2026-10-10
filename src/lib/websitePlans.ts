import { Prisma, WebsitePlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, nextInvoiceNumber, parseCents } from "@/lib/pagefoundryHq";

function requiredString(value: unknown, error: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(error);
  return value.trim();
}

function positiveCents(value: unknown, error: string) {
  const cents = parseCents(value);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error(error);
  return cents;
}

export function monthStart(goLiveDate: Date, offset: number) {
  const year = goLiveDate.getUTCFullYear();
  const month = goLiveDate.getUTCMonth() + offset;
  const day = goLiveDate.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

export function monthlyAmount(plan: Pick<WebsitePlan, "initialMonthlyCents" | "initialMonths" | "laterMonthlyCents">, month: number) {
  return month <= plan.initialMonths ? plan.initialMonthlyCents : plan.laterMonthlyCents;
}

async function createPlanInvoice(
  tx: Prisma.TransactionClient,
  plan: WebsitePlan,
  stage: "DEPOSIT" | "FINAL" | "MONTHLY",
  month: number | null,
  issueDate: Date,
) {
  const isMonthly = stage === "MONTHLY";
  const amount = stage === "DEPOSIT" ? plan.depositCents : stage === "FINAL" ? plan.setupPriceCents - plan.depositCents : monthlyAmount(plan, month!);
  const periodStart = isMonthly ? monthStart(plan.goLiveDate!, month! - 1) : stage === "FINAL" ? plan.goLiveDate : null;
  const periodEnd = isMonthly ? addDays(monthStart(plan.goLiveDate!, month!), -1) : stage === "FINAL" ? plan.goLiveDate : null;
  const description = stage === "DEPOSIT"
    ? `${plan.title} - Anzahlung 50 % auf ${formatEuro(plan.setupPriceCents)} Gesamthonorar`
    : stage === "FINAL"
      ? `${plan.title} - Schlusszahlung 50 % nach Fertigstellung und Go-live; Anzahlung bereits berechnet`
      : `${plan.title} - Hosting, Backups, Sicherheitsupdates, technische Betreuung inkl. einfacher Text-/Bildänderungen${month! <= plan.initialMonths ? " und anteilige Entwicklungskosten" : ""}, Monat ${month}`;
  const notes = stage === "DEPOSIT"
    ? "Vorauszahlung nach Beauftragung. Einrichtung nach Zahlungseingang. Restzahlung bei Fertigstellung und Go-live."
    : stage === "FINAL"
      ? `Gesamthonorar ${formatEuro(plan.setupPriceCents)}, abzüglich berechneter Anzahlung ${formatEuro(plan.depositCents)}.`
      : `Monate 1-${plan.initialMonths}: ${formatEuro(plan.initialMonthlyCents)}/Monat; ab Monat ${plan.initialMonths + 1}: ${formatEuro(plan.laterMonthlyCents)}/Monat. Dauerauftrag nach Phase 1 anpassen.`;
  return tx.invoice.create({
    data: {
      number: await nextInvoiceNumber(tx, issueDate),
      clientId: plan.clientId,
      issueDate,
      dueDate: addDays(issueDate, 14),
      servicePeriodStart: periodStart,
      servicePeriodEnd: periodEnd,
      websitePlanId: plan.id,
      websitePlanStage: stage,
      websitePlanMonth: month ?? 0,
      subtotalCents: amount,
      totalCents: amount,
      notes,
      items: {
        create: [{ description, quantity: 1, unitPriceCents: amount, taxRateBps: 0, lineNetCents: amount, lineTaxCents: 0, lineGrossCents: amount }],
      },
    },
  });
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export async function createWebsitePlan(input: Record<string, unknown>) {
  const clientId = requiredString(input.clientId, "website_plan_client_required");
  const title = requiredString(input.title, "website_plan_title_required");
  const setupPriceCents = positiveCents(input.setupPrice, "website_plan_setup_price_invalid");
  const initialMonthlyCents = positiveCents(input.initialMonthly, "website_plan_monthly_price_invalid");
  const laterMonthlyCents = positiveCents(input.laterMonthly, "website_plan_later_price_invalid");
  const initialMonths = Number(input.initialMonths);
  if (!Number.isSafeInteger(initialMonths) || initialMonths < 1 || initialMonths > 120) throw new Error("website_plan_months_invalid");
  const depositCents = Math.round(setupPriceCents / 2);
  const issueDate = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.businessClient.findUniqueOrThrow({ where: { id: clientId } });
    const plan = await tx.websitePlan.create({
      data: {
        clientId,
        title,
        setupPriceCents,
        depositCents,
        initialMonthlyCents,
        initialMonths,
        laterMonthlyCents,
        supportEmail: typeof input.supportEmail === "string" && input.supportEmail.trim() ? input.supportEmail.trim() : "admin@pagefoundry.de",
        hostingProvider: typeof input.hostingProvider === "string" && input.hostingProvider.trim() ? input.hostingProvider.trim() : null,
        hostingRegion: typeof input.hostingRegion === "string" && input.hostingRegion.trim() ? input.hostingRegion.trim() : null,
        backupInterval: typeof input.backupInterval === "string" && input.backupInterval.trim() ? input.backupInterval.trim() : null,
        backupRetention: typeof input.backupRetention === "string" && input.backupRetention.trim() ? input.backupRetention.trim() : null,
        subprocessors: typeof input.subprocessors === "string" && input.subprocessors.trim() ? input.subprocessors.trim() : null,
      },
    });
    await createPlanInvoice(tx, plan, "DEPOSIT", null, issueDate);
    return plan;
  });
}

export async function activateWebsitePlan(id: string, rawDate: unknown) {
  const dateText = requiredString(rawDate, "website_plan_golive_required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error("website_plan_golive_invalid");
  const goLiveDate = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(goLiveDate.getTime()) || goLiveDate.toISOString().slice(0, 10) !== dateText || goLiveDate > new Date()) {
    throw new Error("website_plan_golive_invalid");
  }
  return prisma.$transaction(async (tx) => {
    const plan = await tx.websitePlan.findUniqueOrThrow({ where: { id }, include: { invoices: true } });
    if (plan.goLiveDate) throw new Error("website_plan_already_active");
    const deposit = plan.invoices.find((invoice) => invoice.websitePlanStage === "DEPOSIT");
    if (deposit?.status !== "PAID") throw new Error("website_plan_deposit_unpaid");
    const updated = await tx.websitePlan.update({ where: { id }, data: { goLiveDate, billedMonths: 1 } });
    const issueDate = new Date();
    const final = await createPlanInvoice(tx, updated, "FINAL", null, issueDate);
    await tx.invoice.update({
      where: { id: final.id },
      data: { notes: `Gesamthonorar ${formatEuro(plan.setupPriceCents)}, abzüglich bezahlter Anzahlung ${formatEuro(plan.depositCents)} aus Rechnung ${deposit.number}; verbleibend ${formatEuro(plan.setupPriceCents - plan.depositCents)}.` },
    });
    await createPlanInvoice(tx, updated, "MONTHLY", 1, issueDate);
    const service = await tx.clientService.create({
      data: {
        clientId: plan.clientId,
        title: `${plan.title} - Monatlicher Website-Service`,
        unitPriceCents: plan.initialMonthlyCents,
        taxRateBps: 0,
        billingInterval: "monthly",
        startedAt: goLiveDate,
        nextInvoiceDate: monthStart(goLiveDate, 1),
        notes: `Monate 1-${plan.initialMonths}: ${formatEuro(plan.initialMonthlyCents)}, danach ${formatEuro(plan.laterMonthlyCents)} pro Monat.`,
      },
    });
    return tx.websitePlan.update({ where: { id }, data: { clientServiceId: service.id } });
  });
}

export async function billNextWebsiteMonth(id: string) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.websitePlan.findUniqueOrThrow({ where: { id } });
    if (!plan.goLiveDate) throw new Error("website_plan_not_active");
    const nextMonth = plan.billedMonths + 1;
    const periodStart = monthStart(plan.goLiveDate, nextMonth - 1);
    if (periodStart > new Date()) throw new Error("website_plan_month_not_started");
    const invoice = await createPlanInvoice(tx, plan, "MONTHLY", nextMonth, new Date());
    await tx.websitePlan.update({ where: { id }, data: { billedMonths: nextMonth } });
    if (plan.clientServiceId) {
      await tx.clientService.update({
        where: { id: plan.clientServiceId },
        data: { unitPriceCents: monthlyAmount(plan, nextMonth), nextInvoiceDate: monthStart(plan.goLiveDate, nextMonth) },
      });
    }
    return invoice;
  });
}
