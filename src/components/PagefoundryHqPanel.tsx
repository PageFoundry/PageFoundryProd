"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Send,
  Settings2,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  companyName: string | null;
  status: "LEAD" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  email: string | null;
  phone: string | null;
  website: string | null;
  billingName: string | null;
  billingEmail: string | null;
  billingAddressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  services: ClientService[];
  invoices: Array<{ id: string; number: string; status: InvoiceStatus; totalCents: number; issueDate: string }>;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  unitPriceCents: number;
  taxRateBps: number;
  billingMode: "ONE_TIME" | "RECURRING";
  isActive: boolean;
};

type ClientService = {
  id: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  taxRateBps: number;
  billingInterval: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
};

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  sentAt: string | null;
  paidAt: string | null;
  client: {
    name: string;
    companyName: string | null;
    billingEmail: string | null;
    email: string | null;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBps: number;
    lineGrossCents: number;
  }>;
};

type Snapshot = {
  generatedAt: string;
  clients: Client[];
  services: Service[];
  activeClientServices: ClientService[];
  invoices: Invoice[];
  summary: {
    clientCount: number;
    activeClientCount: number;
    invoiceCount: number;
    openInvoiceCents: number;
    overdueInvoiceCents: number;
    paidThisMonthCents: number;
    mrrCents: number;
  };
};

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const date = new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });

function formatCents(cents: number) {
  return money.format((cents ?? 0) / 100);
}

function statusClass(status: InvoiceStatus) {
  if (status === "PAID") return "border-green-500/30 bg-green-500/[0.07] text-green-300";
  if (status === "OVERDUE") return "border-red-500/30 bg-red-500/[0.07] text-red-300";
  if (status === "SENT") return "border-amber-500/30 bg-amber-500/[0.07] text-amber-200";
  if (status === "CANCELLED") return "border-pfBorder bg-pfSurface/60 text-pfMuted";
  return "border-pfBorderAccent bg-pfAccentDim text-pfAccent";
}

function fieldClass() {
  return "w-full rounded-sm border border-pfBorder bg-black/40 px-3 py-2 text-sm text-pfText outline-none transition focus:border-pfBorderAccent";
}

function labelClass() {
  return "block text-[0.62rem] font-mono uppercase tracking-widest text-pfMuted mb-1.5";
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function dueInput() {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return due.toISOString().slice(0, 10);
}

export default function PagefoundryHqPanel({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState(snapshot.services[0]?.id ?? "");
  const [selectedContractServiceId, setSelectedContractServiceId] = useState(
    snapshot.services.find((service) => service.billingMode === "RECURRING")?.id ?? snapshot.services[0]?.id ?? "",
  );
  const selectedService = useMemo(
    () => snapshot.services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, snapshot.services],
  );
  const selectedContractService = useMemo(
    () => snapshot.services.find((service) => service.id === selectedContractServiceId),
    [selectedContractServiceId, snapshot.services],
  );

  async function postJson(url: string, payload?: Record<string, unknown>, method = "POST") {
    setError(null);
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "request_failed");
    }
    startTransition(() => router.refresh());
  }

  async function submitClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/admin/hq/clients", Object.fromEntries(form));
      event.currentTarget.reset();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/admin/hq/services", Object.fromEntries(form));
      event.currentTarget.reset();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service = snapshot.services.find((item) => item.id === String(form.get("serviceId")));
    try {
      await postJson("/api/admin/hq/invoices", {
        clientId: form.get("clientId"),
        issueDate: form.get("issueDate"),
        dueDate: form.get("dueDate"),
        notes: form.get("notes"),
        items: [
          {
            serviceId: form.get("serviceId") || undefined,
            description: form.get("description") || service?.name,
            quantity: form.get("quantity"),
            unitPrice: form.get("unitPrice"),
            taxRate: form.get("taxRate"),
          },
        ],
      });
      event.currentTarget.reset();
      setSelectedServiceId(snapshot.services[0]?.id ?? "");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitClientService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/admin/hq/client-services", Object.fromEntries(form));
      event.currentTarget.reset();
      setSelectedContractServiceId(
        snapshot.services.find((service) => service.billingMode === "RECURRING")?.id ?? snapshot.services[0]?.id ?? "",
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updateInvoice(id: string, status: InvoiceStatus) {
    try {
      await postJson(`/api/admin/hq/invoices/${id}`, { status }, "PATCH");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function sendInvoice(id: string) {
    try {
      await postJson(`/api/admin/hq/invoices/${id}/send`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const openInvoices = snapshot.invoices.filter((invoice) => invoice.status === "SENT" || invoice.status === "OVERDUE");

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-sm border border-red-500/30 bg-red-500/[0.07] p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Building2 size={18} />} label="Kunden" value={snapshot.summary.clientCount.toString()} sub={`${snapshot.summary.activeClientCount} aktiv`} />
        <Metric icon={<Banknote size={18} />} label="MRR" value={formatCents(snapshot.summary.mrrCents)} sub="aktive Monatsservices" />
        <Metric icon={<FileText size={18} />} label="Offen" value={formatCents(snapshot.summary.openInvoiceCents)} sub={`${openInvoices.length} Rechnungen`} />
        <Metric icon={<CheckCircle2 size={18} />} label="Bezahlt" value={formatCents(snapshot.summary.paidThisMonthCents)} sub="dieser Monat" />
      </div>

      {snapshot.summary.overdueInvoiceCents > 0 && (
        <div className="flex items-center gap-3 rounded-sm border border-red-500/30 bg-red-500/[0.07] p-4 text-red-200">
          <AlertTriangle size={18} />
          <span className="text-sm font-mono">{formatCents(snapshot.summary.overdueInvoiceCents)} ueberfaellig</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
        <form onSubmit={submitClient} className="pf-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="label-mono">Kunde</span>
            <Building2 size={17} className="text-pfAccent" />
          </div>
          <div className="space-y-3">
            <TextField name="name" label="Name" required />
            <TextField name="companyName" label="Firma" />
            <TextField name="email" label="E-Mail" type="email" />
            <TextField name="phone" label="Telefon" />
            <TextField name="website" label="Website" />
            <TextField name="billingAddressLine1" label="Rechnungsadresse" />
            <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
              <TextField name="postalCode" label="PLZ" />
              <TextField name="city" label="Ort" />
            </div>
            <button className="btn-accent w-full justify-center gap-2" disabled={isPending}>
              <Plus size={15} /> Anlegen
            </button>
          </div>
        </form>

        <form onSubmit={submitService} className="pf-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="label-mono">Service</span>
            <Settings2 size={17} className="text-pfAccent" />
          </div>
          <div className="space-y-3">
            <TextField name="name" label="Name" required />
            <TextField name="description" label="Beschreibung" />
            <div className="grid grid-cols-[1fr_0.8fr] gap-3">
              <TextField name="unitPrice" label="Netto EUR" defaultValue="0,00" required />
              <TextField name="taxRate" label="USt %" defaultValue="19" required />
            </div>
            <label>
              <span className={labelClass()}>Abrechnung</span>
              <select name="billingMode" className={fieldClass()} defaultValue="ONE_TIME">
                <option value="ONE_TIME">Einmalig</option>
                <option value="RECURRING">Wiederkehrend</option>
              </select>
            </label>
            <button className="btn-accent w-full justify-center gap-2" disabled={isPending}>
              <Plus size={15} /> Anlegen
            </button>
          </div>
        </form>

        <form onSubmit={submitInvoice} className="pf-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <span className="label-mono">Rechnung</span>
            <FileText size={17} className="text-pfAccent" />
          </div>
          <div className="space-y-3">
            <label>
              <span className={labelClass()}>Kunde</span>
              <select name="clientId" className={fieldClass()} required>
                <option value="">Auswaehlen</option>
                {snapshot.clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.companyName || client.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass()}>Service</span>
              <select
                name="serviceId"
                className={fieldClass()}
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
              >
                <option value="">Freie Position</option>
                {snapshot.services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
            <TextField key={`desc-${selectedServiceId}`} name="description" label="Position" defaultValue={selectedService?.name ?? ""} required />
            <div className="grid grid-cols-[0.55fr_1fr_0.7fr] gap-3">
              <TextField name="quantity" label="Menge" defaultValue="1" required />
              <TextField key={`price-${selectedServiceId}`} name="unitPrice" label="Netto EUR" defaultValue={selectedService ? String((selectedService.unitPriceCents / 100).toFixed(2)).replace(".", ",") : "0,00"} required />
              <TextField key={`tax-${selectedServiceId}`} name="taxRate" label="USt %" defaultValue={selectedService ? String(selectedService.taxRateBps / 100) : "19"} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField name="issueDate" label="Datum" type="date" defaultValue={todayInput()} required />
              <TextField name="dueDate" label="Faellig" type="date" defaultValue={dueInput()} required />
            </div>
            <label>
              <span className={labelClass()}>Notiz</span>
              <textarea name="notes" rows={2} className={fieldClass()} />
            </label>
            <button className="btn-accent w-full justify-center gap-2" disabled={isPending}>
              <Plus size={15} /> Entwurf erstellen
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={submitClientService} className="pf-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="label-mono">Laufender Service</span>
          <Banknote size={17} className="text-pfAccent" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_auto]">
          <label>
            <span className={labelClass()}>Kunde</span>
            <select name="clientId" className={fieldClass()} required>
              <option value="">Auswaehlen</option>
              {snapshot.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.companyName || client.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass()}>Service</span>
            <select
              name="serviceId"
              className={fieldClass()}
              value={selectedContractServiceId}
              onChange={(event) => setSelectedContractServiceId(event.target.value)}
              required
            >
              <option value="">Auswaehlen</option>
              {snapshot.services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </label>
          <TextField key={`contract-price-${selectedContractServiceId}`} name="unitPrice" label="Netto EUR" defaultValue={selectedContractService ? String((selectedContractService.unitPriceCents / 100).toFixed(2)).replace(".", ",") : "0,00"} required />
          <TextField key={`contract-tax-${selectedContractServiceId}`} name="taxRate" label="USt %" defaultValue={selectedContractService ? String(selectedContractService.taxRateBps / 100) : "19"} required />
          <TextField name="nextInvoiceDate" label="Naechste Rechnung" type="date" defaultValue={dueInput()} />
          <button className="btn-accent mt-5 justify-center gap-2 md:col-span-2 xl:col-span-1" disabled={isPending}>
            <Plus size={15} /> Aktivieren
          </button>
        </div>
      </form>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <section className="pf-card p-5">
          <div className="mb-5 flex items-baseline justify-between">
            <span className="label-mono">Kundenakten</span>
            <span className="font-mono text-[0.62rem] text-pfMuted">{snapshot.clients.length} total</span>
          </div>
          <div className="space-y-3">
            {snapshot.clients.map((client) => (
              <div key={client.id} className="rounded-sm border border-pfBorder bg-pfSurface/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-pfText">{client.companyName || client.name}</div>
                    <div className="mt-1 font-mono text-[0.7rem] text-pfMuted">{client.email || client.billingEmail || "keine E-Mail"}</div>
                  </div>
                  <span className="status-badge border-pfBorder bg-black/30 text-pfSubtle">{client.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Services" value={client.services.length.toString()} />
                  <MiniStat label="Rechnungen" value={client.invoices.length.toString()} />
                  <MiniStat label="Ort" value={client.city || "-"} />
                </div>
              </div>
            ))}
            {snapshot.clients.length === 0 && <p className="text-sm text-pfMuted">Noch keine Kunden.</p>}
          </div>
        </section>

        <section className="pf-card p-5">
          <div className="mb-5 flex items-baseline justify-between">
            <span className="label-mono">Rechnungen</span>
            <span className="font-mono text-[0.62rem] text-pfMuted">{snapshot.invoices.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Kunde</th>
                  <th>Faellig</th>
                  <th>Betrag</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-mono text-xs text-pfText">{invoice.number}</td>
                    <td>
                      <div className="text-sm text-pfText">{invoice.client.companyName || invoice.client.name}</div>
                      <div className="font-mono text-[0.65rem] text-pfMuted">{invoice.client.billingEmail || invoice.client.email || "-"}</div>
                    </td>
                    <td className="font-mono text-xs text-pfSubtle">{date.format(new Date(invoice.dueDate))}</td>
                    <td className="font-mono text-sm font-bold text-pfAccent">{formatCents(invoice.totalCents)}</td>
                    <td><span className={`status-badge ${statusClass(invoice.status)}`}>{invoice.status}</span></td>
                    <td>
                      <div className="flex min-w-40 flex-wrap gap-2">
                        <a
                          href={`/api/admin/hq/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-pfBorder text-pfSubtle hover:border-pfBorderAccent hover:text-pfAccent"
                          title="PDF"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => sendInvoice(invoice.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-pfBorder text-pfSubtle hover:border-pfBorderAccent hover:text-pfAccent"
                          title="Senden"
                          type="button"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => updateInvoice(invoice.id, "PAID")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-pfBorder text-pfSubtle hover:border-green-500/40 hover:text-green-300"
                          title="Bezahlt"
                          type="button"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {snapshot.invoices.length === 0 && <p className="mt-4 text-sm text-pfMuted">Noch keine Rechnungen.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="pf-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-mono">{label}</span>
        <span className="text-pfAccent">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-pfText">{value}</div>
      <div className="mt-2 font-mono text-xs text-pfMuted">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-pfBorder bg-black/20 p-2">
      <div className="font-mono text-[0.58rem] uppercase tracking-widest text-pfMuted">{label}</div>
      <div className="mt-1 truncate text-pfSubtle">{value}</div>
    </div>
  );
}

function TextField({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className={labelClass()}>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} className={fieldClass()} />
    </label>
  );
}
