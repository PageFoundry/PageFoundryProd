"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Plus,
  Receipt,
  Search,
  Send,
  Settings2,
  Trash2,
  Users,
  X,
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

type DrawerKind = "client" | "service" | "invoice" | "contract" | null;

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const date = new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Entwurf",
  SENT: "Versendet",
  PAID: "Bezahlt",
  OVERDUE: "Ueberfaellig",
  CANCELLED: "Storniert",
};

const STATUS_ORDER: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

function formatCents(cents: number) {
  return money.format((cents ?? 0) / 100);
}

function eurFromCents(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseEuroToCents(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function statusClass(status: InvoiceStatus) {
  if (status === "PAID") return "border-green-500/30 bg-green-500/[0.07] text-green-300";
  if (status === "OVERDUE") return "border-red-500/30 bg-red-500/[0.07] text-red-300";
  if (status === "SENT") return "border-amber-500/30 bg-amber-500/[0.07] text-amber-200";
  if (status === "CANCELLED") return "border-pfBorder bg-pfSurface/60 text-pfMuted";
  return "border-pfBorderAccent bg-pfAccentDim text-pfAccent";
}

function isOverdue(invoice: Pick<Invoice, "status" | "dueDate">) {
  if (invoice.status === "OVERDUE") return true;
  return invoice.status === "SENT" && new Date(invoice.dueDate).getTime() < Date.now();
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function dueInput() {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return due.toISOString().slice(0, 10);
}

type LineItem = {
  key: string;
  serviceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
};

function emptyLine(): LineItem {
  return { key: Math.random().toString(36).slice(2), serviceId: "", description: "", quantity: "1", unitPrice: "0,00", taxRate: "0" };
}

export default function PagefoundryHqPanel({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>("ALL");
  const [clientSearch, setClientSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [menuInvoice, setMenuInvoice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const [contractServiceId, setContractServiceId] = useState(
    snapshot.services.find((service) => service.billingMode === "RECURRING")?.id ?? snapshot.services[0]?.id ?? "",
  );
  const contractService = useMemo(
    () => snapshot.services.find((service) => service.id === contractServiceId),
    [contractServiceId, snapshot.services],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawer(null);
        setMenuInvoice(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      setDrawer(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/admin/hq/services", Object.fromEntries(form));
      setDrawer(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await postJson("/api/admin/hq/client-services", Object.fromEntries(form));
      setDrawer(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const items = lineItems
      .filter((item) => item.description.trim() || item.serviceId)
      .map((item) => ({
        serviceId: item.serviceId || undefined,
        description: item.description.trim() || snapshot.services.find((s) => s.id === item.serviceId)?.name || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      }));
    if (items.length === 0) {
      setError("invoice_items_required");
      return;
    }
    try {
      await postJson("/api/admin/hq/invoices", {
        clientId: form.get("clientId"),
        issueDate: form.get("issueDate"),
        dueDate: form.get("dueDate"),
        notes: form.get("notes"),
        items,
      });
      setDrawer(null);
      setLineItems([emptyLine()]);
      setInvoiceClientId("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function changeStatus(id: string, status: InvoiceStatus) {
    setMenuInvoice(null);
    setConfirmCancel(null);
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

  function openInvoiceFor(clientId: string) {
    setInvoiceClientId(clientId);
    setLineItems([emptyLine()]);
    setDrawer("invoice");
  }

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function applyServiceToLine(key: string, serviceId: string) {
    const service = snapshot.services.find((s) => s.id === serviceId);
    updateLine(key, {
      serviceId,
      description: service?.name ?? "",
      unitPrice: service ? eurFromCents(service.unitPriceCents) : "0,00",
      taxRate: service ? String(service.taxRateBps / 100) : "0",
    });
  }

  const lineTotals = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const net = parseEuroToCents(item.unitPrice) * qty;
        const tax = Math.round((net * (Number(item.taxRate) || 0)) / 100);
        acc.net += net;
        acc.tax += tax;
        acc.gross += net + tax;
        return acc;
      },
      { net: 0, tax: 0, gross: 0 },
    );
  }, [lineItems]);

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.trim().toLowerCase();
    return snapshot.invoices.filter((invoice) => {
      if (statusFilter === "OVERDUE") {
        if (!isOverdue(invoice)) return false;
      } else if (statusFilter !== "ALL" && invoice.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        invoice.number,
        invoice.client.companyName,
        invoice.client.name,
        invoice.client.billingEmail,
        invoice.client.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [snapshot.invoices, invoiceSearch, statusFilter]);

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return snapshot.clients;
    return snapshot.clients.filter((client) =>
      [client.companyName, client.name, client.email, client.billingEmail, client.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [snapshot.clients, clientSearch]);

  const openInvoiceCount = snapshot.invoices.filter((invoice) => invoice.status === "SENT" || invoice.status === "OVERDUE").length;

  const statusCounts = useMemo(() => {
    const counts = { ALL: snapshot.invoices.length, DRAFT: 0, SENT: 0, PAID: 0, OVERDUE: 0, CANCELLED: 0 } as Record<string, number>;
    for (const invoice of snapshot.invoices) {
      counts[invoice.status] += 1;
      if (isOverdue(invoice)) counts.OVERDUE += invoice.status === "OVERDUE" ? 0 : 1;
    }
    return counts;
  }, [snapshot.invoices]);

  return (
    <div className="space-y-10">
      {error && (
        <div className="flex items-center gap-3 rounded-sm border border-red-500/30 bg-red-500/[0.07] p-3 text-sm text-red-200">
          <AlertTriangle size={16} />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton icon={<Building2 size={15} />} label="Kunde" onClick={() => setDrawer("client")} />
        <ActionButton icon={<Settings2 size={15} />} label="Service" onClick={() => setDrawer("service")} />
        <ActionButton
          icon={<Banknote size={15} />}
          label="Laufender Service"
          onClick={() => {
            setContractServiceId(
              snapshot.services.find((service) => service.billingMode === "RECURRING")?.id ?? snapshot.services[0]?.id ?? "",
            );
            setDrawer("contract");
          }}
        />
        <button
          onClick={() => openInvoiceFor("")}
          className="btn-accent gap-2"
          type="button"
        >
          <Plus size={15} /> Rechnung erstellen
        </button>
      </div>

      <div className="grid gap-4 fade-in md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Building2 size={18} />} label="Kunden" value={snapshot.summary.clientCount.toString()} sub={`${snapshot.summary.activeClientCount} aktiv`} />
        <Metric icon={<Banknote size={18} />} label="MRR" value={formatCents(snapshot.summary.mrrCents)} sub="aktive Monatsservices" />
        <Metric icon={<FileText size={18} />} label="Offen" value={formatCents(snapshot.summary.openInvoiceCents)} sub={`${openInvoiceCount} Rechnungen`} />
        <Metric icon={<CheckCircle2 size={18} />} label="Bezahlt" value={formatCents(snapshot.summary.paidThisMonthCents)} sub="dieser Monat" />
      </div>

      {snapshot.summary.overdueInvoiceCents > 0 && (
        <button
          type="button"
          onClick={() => setStatusFilter("OVERDUE")}
          className="flex w-full items-center gap-3 rounded-sm border border-red-500/30 bg-red-500/[0.07] p-4 text-left text-red-200 transition-colors hover:bg-red-500/[0.12]"
        >
          <AlertTriangle size={18} />
          <span className="text-sm font-mono">{formatCents(snapshot.summary.overdueInvoiceCents)} ueberfaellig — filtern</span>
          <ChevronDown size={15} className="ml-auto -rotate-90" />
        </button>
      )}

      <section className="pf-card p-5 fade-in-delay-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="label-mono flex items-center gap-2"><Receipt size={14} /> Rechnungen</span>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pfMuted" />
            <input
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
              placeholder="Nr. oder Kunde"
              className="w-56 rounded-sm border border-pfBorder bg-black/30 py-1.5 pl-9 pr-3 text-sm text-pfText outline-none transition focus:border-pfBorderAccent"
            />
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(["ALL", ...STATUS_ORDER] as const).map((value) => (
            <FilterChip
              key={value}
              active={statusFilter === value}
              label={value === "ALL" ? "Alle" : STATUS_LABELS[value]}
              count={statusCounts[value]}
              onClick={() => setStatusFilter(value)}
            />
          ))}
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
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const overdue = isOverdue(invoice);
                return (
                  <tr key={invoice.id} className={overdue ? "bg-red-500/[0.04]" : undefined}>
                    <td className="font-mono text-xs text-pfText">{invoice.number}</td>
                    <td>
                      <div className="text-sm text-pfText">{invoice.client.companyName || invoice.client.name}</div>
                      <div className="font-mono text-[0.65rem] text-pfMuted">{invoice.client.billingEmail || invoice.client.email || "-"}</div>
                    </td>
                    <td className={`font-mono text-xs ${overdue ? "text-red-300" : "text-pfSubtle"}`}>{date.format(new Date(invoice.dueDate))}</td>
                    <td className="font-mono text-sm font-bold text-pfAccent">{formatCents(invoice.totalCents)}</td>
                    <td><span className={`status-badge ${statusClass(invoice.status)}`}>{STATUS_LABELS[invoice.status]}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <IconAction href={`/api/admin/hq/invoices/${invoice.id}/pdf`} title="PDF"><Download size={14} /></IconAction>
                        <IconAction onClick={() => sendInvoice(invoice.id)} title="Per E-Mail senden"><Send size={14} /></IconAction>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuInvoice(menuInvoice === invoice.id ? null : invoice.id);
                              setConfirmCancel(null);
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-sm border border-pfBorder px-2 text-pfSubtle transition hover:border-pfBorderAccent hover:text-pfAccent"
                            title="Status setzen"
                          >
                            <span className="font-mono text-[0.62rem] uppercase tracking-wider">Status</span>
                            <ChevronDown size={13} />
                          </button>
                          {menuInvoice === invoice.id && (
                            <>
                              <button type="button" className="fixed inset-0 z-40 cursor-default" onClick={() => { setMenuInvoice(null); setConfirmCancel(null); }} aria-label="Menue schliessen" />
                              <div className="menu-in absolute right-0 z-50 mt-1 w-44 rounded-sm border border-pfBorderMid bg-pfCard p-1 shadow-card">
                                {STATUS_ORDER.map((status) => {
                                  const current = invoice.status === status;
                                  if (status === "CANCELLED") {
                                    return (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() => (confirmCancel === invoice.id ? changeStatus(invoice.id, status) : setConfirmCancel(invoice.id))}
                                        className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-mono text-[0.68rem] uppercase tracking-wider text-red-300 transition hover:bg-red-500/10"
                                      >
                                        {confirmCancel === invoice.id ? "Wirklich stornieren?" : STATUS_LABELS[status]}
                                        {confirmCancel === invoice.id && <CheckCircle2 size={13} />}
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      disabled={current}
                                      onClick={() => changeStatus(invoice.id, status)}
                                      className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-mono text-[0.68rem] uppercase tracking-wider transition ${current ? "cursor-default text-pfMuted" : "text-pfSubtle hover:bg-pfSurface hover:text-pfAccent"}`}
                                    >
                                      {STATUS_LABELS[status]}
                                      {current && <span className="h-1.5 w-1.5 rounded-full bg-pfAccent" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <p className="mt-6 text-center text-sm text-pfMuted">
              {snapshot.invoices.length === 0 ? "Noch keine Rechnungen." : "Keine Rechnung passt zum Filter."}
            </p>
          )}
        </div>
      </section>

      <section className="fade-in-delay-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="label-mono flex items-center gap-2"><Users size={14} /> Kundenakten</span>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pfMuted" />
            <input
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Kunde suchen"
              className="w-56 rounded-sm border border-pfBorder bg-black/30 py-1.5 pl-9 pr-3 text-sm text-pfText outline-none transition focus:border-pfBorderAccent"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => {
            const open = expandedClient === client.id;
            return (
              <div key={client.id} className="pf-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedClient(open ? null : client.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-pfText">{client.companyName || client.name}</div>
                    <div className="mt-1 truncate font-mono text-[0.7rem] text-pfMuted">{client.email || client.billingEmail || "keine E-Mail"}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="status-badge border-pfBorder bg-black/30 text-pfSubtle">{client.status}</span>
                    <ChevronDown size={15} className={`text-pfMuted transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <div className="grid grid-cols-3 gap-2 px-4 pb-4 text-xs">
                  <MiniStat label="Services" value={client.services.length.toString()} />
                  <MiniStat label="Rechnungen" value={client.invoices.length.toString()} />
                  <MiniStat label="Ort" value={client.city || "-"} />
                </div>

                {open && (
                  <div className="border-t border-pfBorder bg-black/20 p-4">
                    <div className="mb-4">
                      <div className="label-mono mb-2 text-pfMuted">Laufende Services</div>
                      {client.services.length === 0 ? (
                        <p className="text-xs text-pfMuted">keine</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {client.services.map((service) => (
                            <li key={service.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate text-pfSubtle">{service.title}</span>
                              <span className="shrink-0 font-mono text-pfAccent">{formatCents(service.unitPriceCents * service.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="mb-4">
                      <div className="label-mono mb-2 text-pfMuted">Letzte Rechnungen</div>
                      {client.invoices.length === 0 ? (
                        <p className="text-xs text-pfMuted">keine</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {client.invoices.map((invoice) => (
                            <li key={invoice.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono text-pfSubtle">{invoice.number}</span>
                              <span className={`status-badge ${statusClass(invoice.status)}`}>{STATUS_LABELS[invoice.status]}</span>
                              <span className="ml-auto font-mono text-pfAccent">{formatCents(invoice.totalCents)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button type="button" onClick={() => openInvoiceFor(client.id)} className="btn-outline w-full gap-2">
                      <Plus size={14} /> Rechnung fuer diesen Kunden
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filteredClients.length === 0 && <p className="text-sm text-pfMuted">{snapshot.clients.length === 0 ? "Noch keine Kunden." : "Kein Kunde passt zur Suche."}</p>}
        </div>
      </section>

      <Drawer open={drawer === "client"} title="Neuer Kunde" icon={<Building2 size={16} />} onClose={() => setDrawer(null)}>
        <form onSubmit={submitClient} className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <Field name="name" label="Name" required />
            <Field name="companyName" label="Firma" />
            <Field name="email" label="E-Mail" type="email" />
            <Field name="phone" label="Telefon" />
            <Field name="website" label="Website" />
            <Field name="billingAddressLine1" label="Rechnungsadresse" />
            <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
              <Field name="postalCode" label="PLZ" />
              <Field name="city" label="Ort" />
            </div>
          </div>
          <DrawerFooter isPending={isPending} submitLabel="Kunde anlegen" onCancel={() => setDrawer(null)} />
        </form>
      </Drawer>

      <Drawer open={drawer === "service"} title="Neuer Service" icon={<Settings2 size={16} />} onClose={() => setDrawer(null)}>
        <form onSubmit={submitService} className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <Field name="name" label="Name" required />
            <Field name="description" label="Beschreibung" />
            <div className="grid grid-cols-[1fr_0.8fr] gap-3">
              <Field name="unitPrice" label="Preis EUR" defaultValue="0,00" required />
              <Field name="taxRate" label="USt %" defaultValue="0" required />
            </div>
            <SelectField name="billingMode" label="Abrechnung" defaultValue="ONE_TIME">
              <option value="ONE_TIME">Einmalig</option>
              <option value="RECURRING">Wiederkehrend</option>
            </SelectField>
          </div>
          <DrawerFooter isPending={isPending} submitLabel="Service anlegen" onCancel={() => setDrawer(null)} />
        </form>
      </Drawer>

      <Drawer open={drawer === "contract"} title="Laufender Service" icon={<Banknote size={16} />} onClose={() => setDrawer(null)}>
        <form onSubmit={submitContract} className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <SelectField name="clientId" label="Kunde" required defaultValue="">
              <option value="">Auswaehlen</option>
              {snapshot.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.companyName || client.name}</option>
              ))}
            </SelectField>
            <SelectField
              name="serviceId"
              label="Service"
              required
              value={contractServiceId}
              onChange={(event) => setContractServiceId(event.target.value)}
            >
              <option value="">Auswaehlen</option>
              {snapshot.services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <Field key={`c-price-${contractServiceId}`} name="unitPrice" label="Netto EUR" defaultValue={contractService ? eurFromCents(contractService.unitPriceCents) : "0,00"} required />
              <Field key={`c-tax-${contractServiceId}`} name="taxRate" label="USt %" defaultValue={contractService ? String(contractService.taxRateBps / 100) : "0"} required />
            </div>
            <Field name="nextInvoiceDate" label="Naechste Rechnung" type="date" defaultValue={dueInput()} />
          </div>
          <DrawerFooter isPending={isPending} submitLabel="Service aktivieren" onCancel={() => setDrawer(null)} />
        </form>
      </Drawer>

      <Drawer open={drawer === "invoice"} title="Neue Rechnung" icon={<FileText size={16} />} wide onClose={() => setDrawer(null)}>
        <form onSubmit={submitInvoice} className="flex h-full flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <SelectField name="clientId" label="Kunde" required value={invoiceClientId} onChange={(event) => setInvoiceClientId(event.target.value)}>
              <option value="">Auswaehlen</option>
              {snapshot.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.companyName || client.name}</option>
              ))}
            </SelectField>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={labelText}>Positionen</span>
                <button type="button" onClick={() => setLineItems((prev) => [...prev, emptyLine()])} className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-pfAccent transition hover:text-pfAccentWarm">
                  <Plus size={13} /> Position
                </button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.key} className="rounded-sm border border-pfBorder bg-black/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest text-pfMuted">Position {index + 1}</span>
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => setLineItems((prev) => prev.filter((line) => line.key !== item.key))} className="text-pfMuted transition hover:text-red-300" title="Entfernen">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <select
                      value={item.serviceId}
                      onChange={(event) => applyServiceToLine(item.key, event.target.value)}
                      className="pf-input mb-2"
                    >
                      <option value="">Freie Position</option>
                      {snapshot.services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                    <input
                      value={item.description}
                      onChange={(event) => updateLine(item.key, { description: event.target.value })}
                      placeholder="Beschreibung"
                      className="pf-input mb-2"
                      required
                    />
                    <div className="grid grid-cols-[0.55fr_1fr_0.7fr] gap-3">
                      <LabeledInput label="Menge" value={item.quantity} onChange={(value) => updateLine(item.key, { quantity: value })} />
                      <LabeledInput label="Netto EUR" value={item.unitPrice} onChange={(value) => updateLine(item.key, { unitPrice: value })} />
                      <LabeledInput label="USt %" value={item.taxRate} onChange={(value) => updateLine(item.key, { taxRate: value })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field name="issueDate" label="Datum" type="date" defaultValue={todayInput()} required />
              <Field name="dueDate" label="Faellig" type="date" defaultValue={dueInput()} required />
            </div>
            <div>
              <span className={labelText}>Notiz</span>
              <textarea name="notes" rows={2} className="pf-input mt-1.5" />
            </div>
          </div>

          <div className="border-t border-pfBorder px-6 py-4">
            <div className="mb-3 space-y-1.5 font-mono text-xs">
              {lineTotals.tax > 0 && (
                <>
                  <div className="flex justify-between text-pfMuted"><span>Netto</span><span>{formatCents(lineTotals.net)}</span></div>
                  <div className="flex justify-between text-pfMuted"><span>USt</span><span>{formatCents(lineTotals.tax)}</span></div>
                </>
              )}
              <div className="flex justify-between text-base font-bold text-pfAccent"><span>Gesamt</span><span>{formatCents(lineTotals.gross)}</span></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDrawer(null)} className="btn-outline flex-1">Abbrechen</button>
              <button className="btn-accent flex-[1.5] gap-2" disabled={isPending}><Plus size={15} /> Entwurf erstellen</button>
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

const labelText = "block text-[0.62rem] font-mono uppercase tracking-widest text-pfMuted";

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-outline gap-2">
      {icon} {label}
    </button>
  );
}

function FilterChip({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider transition ${
        active ? "border-pfBorderAccent bg-pfAccentDim text-pfAccent" : "border-pfBorder text-pfSubtle hover:border-pfBorderMid hover:text-pfText"
      }`}
    >
      {label}
      {typeof count === "number" && count > 0 && <span className={active ? "text-pfAccent/70" : "text-pfMuted"}>{count}</span>}
    </button>
  );
}

function IconAction({ children, href, onClick, title }: { children: ReactNode; href?: string; onClick?: () => void; title: string }) {
  const cls = "inline-flex h-8 w-8 items-center justify-center rounded-sm border border-pfBorder text-pfSubtle transition hover:border-pfBorderAccent hover:text-pfAccent";
  if (href) {
    return <a href={href} target="_blank" rel="noreferrer" className={cls} title={title}>{children}</a>;
  }
  return <button type="button" onClick={onClick} className={cls} title={title}>{children}</button>;
}

function Drawer({ open, title, icon, children, onClose, wide }: { open: boolean; title: string; icon: ReactNode; children: ReactNode; onClose: () => void; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button type="button" aria-label="Schliessen" onClick={onClose} className="drawer-backdrop absolute inset-0 bg-black/70 backdrop-blur-xs" />
      <div className={`drawer-panel relative flex h-full w-full flex-col border-l border-pfBorderMid bg-pfBg shadow-card ${wide ? "max-w-xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-pfBorder px-6 py-5">
          <span className="label-mono flex items-center gap-2">{icon} {title}</span>
          <button type="button" onClick={onClose} className="text-pfMuted transition hover:text-pfAccent" aria-label="Schliessen">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DrawerFooter({ isPending, submitLabel, onCancel }: { isPending: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex gap-3 border-t border-pfBorder px-6 py-4">
      <button type="button" onClick={onCancel} className="btn-outline flex-1">Abbrechen</button>
      <button className="btn-accent flex-[1.5] gap-2" disabled={isPending}><Plus size={15} /> {submitLabel}</button>
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

function Field({ name, label, type = "text", defaultValue, required }: { name: string; label: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className={labelText}>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} className="pf-input mt-1.5" />
    </label>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className={labelText}>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required className="pf-input mt-1.5" />
    </label>
  );
}

function SelectField({
  name,
  label,
  children,
  required,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  children: ReactNode;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className={labelText}>{label}</span>
      <select name={name} required={required} defaultValue={defaultValue} value={value} onChange={onChange} className="pf-input mt-1.5">
        {children}
      </select>
    </label>
  );
}
