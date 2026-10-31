"use client";

import { useMemo, useState } from "react";
import { COMMISSION_MONTHS, commissionFor, SALES_LEAD_STATUSES, SALES_SETTABLE_STATUSES, STATUS_LABELS_DE } from "@/lib/sales/leads";

type Status = (typeof SALES_LEAD_STATUSES)[number];

type Lead = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  status: Status;
  oneTimeValueCents: number | null;
  monthlyValueCents: number | null;
  commissionPercentAtWin: number | null;
  wonAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; email: string; name: string | null };
};

type Booking = { id: string; email: string; createdAt: string; start: string; consultationType: string; referredBy: string | null };

type Kit = {
  packages: { id: string; name: string; description: string; purchase: number; setup: number; monthly: number; changes: string }[];
  offers: { name: string; detail: string; url: string }[];
  demos: { name: string; url: string }[];
  taxNote: string;
  terms: string;
};

type Props = {
  isAdmin: boolean;
  me: { email: string; commissionPercent: number | null };
  referralUrl: string | null;
  initialLeads: Lead[];
  bookings: Booking[];
  kit: Kit;
};

const TABS = [
  { id: "leads", label: "Meine Leads" },
  { id: "referral", label: "Empfehlungslink" },
  { id: "kit", label: "Verkaufsmaterial" },
  { id: "commission", label: "Provision" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const euro0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
const dateTimeFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

const inputClass =
  "w-full rounded-sm border border-pfBorder bg-pfBg px-3 py-2 text-sm text-pfText placeholder:text-pfMuted focus:border-pfAccent focus:outline-none";
const cardClass = "rounded-sm border border-pfBorder bg-pfCard p-5";
const mono = { fontFamily: "var(--font-mono)" } as const;

function statusTone(s: Status) {
  if (s === "WON") return "border-pfSuccess text-pfSuccess";
  if (s === "LOST") return "border-pfDanger text-pfDanger";
  if (s === "OFFER" || s === "MEETING") return "border-pfBorderAccent text-pfAccent";
  return "border-pfBorder text-pfSubtle";
}

function centsFromEuroInput(v: string): number | null {
  const t = v.trim().replace(/\./g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export default function SalesPortal({ isAdmin, me, referralUrl, initialLeads, bookings, kit }: Props) {
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filter, setFilter] = useState<"open" | "all">("open");

  const visible = useMemo(
    () => (filter === "open" ? leads.filter((l) => l.status !== "WON" && l.status !== "LOST") : leads),
    [leads, filter]
  );

  function replaceLead(lead: Lead) {
    setLeads((prev) => {
      const rest = prev.filter((l) => l.id !== lead.id);
      return [lead, ...rest];
    });
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-sm border px-3 py-2 text-[0.65rem] uppercase tracking-widest transition-colors ${
              tab === t.id ? "border-pfBorderAccent bg-pfAccentDim text-pfAccent" : "border-pfBorder text-pfSubtle hover:text-pfAccent"
            }`}
            style={mono}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "leads" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg text-pfText">{isAdmin ? "Alle Leads" : "Meine Leads"} ({visible.length})</h2>
              <select value={filter} onChange={(e) => setFilter(e.target.value as "open" | "all")} className="rounded-sm border border-pfBorder bg-pfBg px-3 py-2 text-sm text-pfText focus:border-pfAccent focus:outline-none" aria-label="Filter">
                <option value="open">Offen</option>
                <option value="all">Alle</option>
              </select>
            </div>
            {visible.length === 0 ? (
              <p className="text-pfSubtle">Noch keine Leads. Rechts den ersten anlegen.</p>
            ) : (
              <ul className="space-y-3">
                {visible.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} isAdmin={isAdmin} onSaved={replaceLead} />
                ))}
              </ul>
            )}
          </div>
          <NewLeadForm onCreated={replaceLead} />
        </div>
      )}

      {tab === "referral" && (
        <div className="space-y-6">
          <div className={cardClass}>
            <h2 className="mb-2 text-lg text-pfText">Dein Empfehlungslink</h2>
            {referralUrl ? (
              <>
                <p className="mb-4 text-sm text-pfSubtle">
                  Schick diesen Link an Interessenten. Wer darüber eine Beratung bucht, wird dir automatisch zugeordnet.
                </p>
                <CopyField value={referralUrl} />
              </>
            ) : (
              <p className="text-sm text-pfSubtle">Noch kein Empfehlungscode hinterlegt. Fabian richtet ihn ein.</p>
            )}
          </div>
          <div>
            <h2 className="mb-4 text-lg text-pfText">Gebuchte Beratungen über {isAdmin ? "Empfehlungslinks" : "deinen Link"} ({bookings.length})</h2>
            {bookings.length === 0 ? (
              <p className="text-pfSubtle">Noch keine.</p>
            ) : (
              <ul className="space-y-2">
                {bookings.map((b) => (
                  <li key={b.id} className={`${cardClass} flex flex-wrap items-baseline justify-between gap-2 py-3`}>
                    <span className="text-pfText break-all">{b.email}</span>
                    <span className="text-xs text-pfSubtle" style={mono}>
                      Termin {dateTimeFmt.format(new Date(b.start))}
                      {isAdmin && b.referredBy ? ` · ${b.referredBy}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "kit" && (
        <div className="space-y-10">
          <div>
            <h2 className="mb-4 text-lg text-pfText">Website-Pakete</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {kit.packages.map((p) => (
                <div key={p.id} className={cardClass}>
                  <div className="label-mono mb-2">{p.name}</div>
                  <p className="mb-4 text-sm text-pfSubtle">{p.description}</p>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-2"><dt className="text-pfSubtle">Kauf</dt><dd className="text-pfText">{euro0.format(p.purchase)}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-pfSubtle">Betreut</dt><dd className="text-pfText">{euro0.format(p.setup)} + {euro0.format(p.monthly)}/Monat</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-pfSubtle">Änderungen</dt><dd className="text-right text-pfText">{p.changes}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-pfSubtle">{kit.taxNote}</p>
            <p className="mt-2 text-xs text-pfMuted">{kit.terms}</p>
          </div>
          <div>
            <h2 className="mb-4 text-lg text-pfText">Weitere Angebote</h2>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {kit.offers.map((o) => (
                <li key={o.url} className={cardClass}>
                  <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-pfAccent hover:underline">{o.name}</a>
                  <p className="mt-1 text-sm text-pfSubtle">{o.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-lg text-pfText">Demos & Referenzen zum Zeigen</h2>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {kit.demos.map((d) => (
                <li key={d.url} className="min-w-0">
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className={`${cardClass} block py-3 text-pfText hover:border-pfBorderAccent`}>
                    {d.name}
                    <span className="mt-1 block truncate text-xs text-pfMuted" style={mono}>{d.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "commission" && <CommissionView leads={leads} isAdmin={isAdmin} commissionPercent={me.commissionPercent} />}
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input readOnly value={value} className={inputClass} onFocus={(e) => e.currentTarget.select()} aria-label="Empfehlungslink" />
      <button
        type="button"
        className="btn-accent shrink-0 px-4 py-2 text-[0.62rem]"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* Clipboard nicht verfuegbar: Feld ist markierbar */
          }
        }}
      >
        {copied ? "Kopiert" : "Kopieren"}
      </button>
    </div>
  );
}

async function sendJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Fehler");
  return data;
}

function NewLeadForm({ onCreated }: { onCreated: (l: Lead) => void }) {
  const empty = { companyName: "", contactName: "", email: "", phone: "", website: "", notes: "" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      className={`${cardClass} h-fit space-y-3`}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const { lead } = await sendJson("/api/sales/leads", "POST", form);
          onCreated(lead);
          setForm(empty);
          setMsg({ ok: true, text: "Lead gespeichert und dir zugeordnet." });
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-lg text-pfText">Neuer Lead</h2>
      <p className="text-xs text-pfSubtle">Website oder E-Mail ist Pflicht. Wer einen Lead zuerst einträgt, bekommt ihn.</p>
      <input required placeholder="Firma *" value={form.companyName} onChange={set("companyName")} className={inputClass} maxLength={200} />
      <input placeholder="Ansprechpartner" value={form.contactName} onChange={set("contactName")} className={inputClass} maxLength={200} />
      <input placeholder="Website (z. B. firma.de)" value={form.website} onChange={set("website")} className={inputClass} maxLength={512} />
      <input type="email" placeholder="E-Mail" value={form.email} onChange={set("email")} className={inputClass} maxLength={320} />
      <input placeholder="Telefon" value={form.phone} onChange={set("phone")} className={inputClass} maxLength={50} />
      <textarea placeholder="Notizen (Bedarf, nächster Schritt …)" value={form.notes} onChange={set("notes")} className={`${inputClass} min-h-[90px]`} maxLength={4000} />
      <button type="submit" disabled={busy} className="btn-accent w-full px-4 py-2 text-[0.62rem] disabled:opacity-60">
        {busy ? "Speichere …" : "Lead anlegen"}
      </button>
      {msg && <p className={`text-sm ${msg.ok ? "text-pfSuccess" : "text-pfDanger"}`} role="status">{msg.text}</p>}
    </form>
  );
}

function LeadCard({ lead, isAdmin, onSaved }: { lead: Lead; isAdmin: boolean; onSaved: (l: Lead) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [oneTime, setOneTime] = useState(lead.oneTimeValueCents != null ? String(lead.oneTimeValueCents / 100) : "");
  const [monthly, setMonthly] = useState(lead.monthlyValueCents != null ? String(lead.monthlyValueCents / 100) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const closed = lead.status === "WON" || lead.status === "LOST";
  const editable = isAdmin || !closed;
  const statusOptions: readonly Status[] = isAdmin ? SALES_LEAD_STATUSES : SALES_SETTABLE_STATUSES;

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = { notes };
      if (status !== lead.status) body.status = status;
      if (isAdmin) {
        body.oneTimeValueCents = centsFromEuroInput(oneTime);
        body.monthlyValueCents = centsFromEuroInput(monthly);
      }
      const { lead: updated } = await sendJson(`/api/sales/leads/${lead.id}`, "PATCH", body);
      onSaved(updated);
      setOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={cardClass}>
      <button type="button" className="flex w-full flex-wrap items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="min-w-0">
          <div className="text-pfText">{lead.companyName}</div>
          <div className="mt-1 break-all text-xs text-pfSubtle">
            {[lead.contactName, lead.website, lead.email, lead.phone].filter(Boolean).join(" · ") || "—"}
          </div>
          {isAdmin && <div className="mt-1 text-xs text-pfMuted" style={mono}>{lead.owner.email}</div>}
        </div>
        <span className={`shrink-0 rounded-sm border px-2 py-1 text-[0.6rem] uppercase tracking-widest ${statusTone(lead.status)}`} style={mono}>
          {STATUS_LABELS_DE[lead.status]}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-pfBorder pt-4">
          {lead.website && (
            <a href={/^https?:\/\//.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-pfAccent hover:underline">
              Website öffnen
            </a>
          )}
          {!editable ? (
            <p className="text-sm text-pfSubtle">Abgeschlossen. Änderungen nur durch Fabian.</p>
          ) : (
            <>
              <label className="block text-xs text-pfSubtle">
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={`${inputClass} mt-1`}>
                  {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABELS_DE[s]}</option>)}
                </select>
              </label>
              <label className="block text-xs text-pfSubtle">
                Notizen
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} mt-1 min-h-[80px]`} maxLength={4000} />
              </label>
              {isAdmin && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-pfSubtle">
                    Einmalbetrag (€)
                    <input inputMode="decimal" value={oneTime} onChange={(e) => setOneTime(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                  <label className="block text-xs text-pfSubtle">
                    Monatsrate (€)
                    <input inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                </div>
              )}
              <button type="button" onClick={save} disabled={busy} className="btn-accent px-4 py-2 text-[0.62rem] disabled:opacity-60">
                {busy ? "Speichere …" : "Speichern"}
              </button>
              {err && <p className="text-sm text-pfDanger" role="alert">{err}</p>}
            </>
          )}
          <p className="text-xs text-pfMuted" style={mono}>Angelegt {dateFmt.format(new Date(lead.createdAt))}</p>
        </div>
      )}
    </li>
  );
}

function CommissionView({ leads, isAdmin, commissionPercent }: { leads: Lead[]; isAdmin: boolean; commissionPercent: number | null }) {
  const won = leads.filter((l) => l.status === "WON");
  const rows = won.map((l) => ({ lead: l, c: commissionFor(l) }));
  const totalOneTime = rows.reduce((s, r) => s + (r.c?.oneTimeCents ?? 0), 0);
  const totalMonthly = rows.reduce((s, r) => s + (r.c?.monthlyCents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <h2 className="mb-2 text-lg text-pfText">So funktioniert die Provision</h2>
        <p className="text-sm text-pfSubtle">
          {commissionPercent != null ? `${commissionPercent} %` : "Der vereinbarte Satz"} auf den Einmalbetrag und auf jede bezahlte Monatsrate, für die {COMMISSION_MONTHS} Monate Mindestlaufzeit ab Abschluss.
          Ein Lead zählt, wenn Fabian ihn auf „Gewonnen“ setzt und die Beträge einträgt. Der Satz wird beim Abschluss festgehalten.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Gewonnene Deals" value={String(won.length)} />
        <Stat label="Provision einmalig" value={euro.format(totalOneTime / 100)} />
        <Stat label={`Provision pro Monat (max. ${COMMISSION_MONTHS})`} value={euro.format(totalMonthly / 100)} />
      </div>
      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map(({ lead, c }) => (
            <li key={lead.id} className={`${cardClass} flex flex-wrap items-baseline justify-between gap-2 py-3`}>
              <span className="text-pfText">
                {lead.companyName}
                {isAdmin && <span className="ml-2 text-xs text-pfMuted">{lead.owner.email}</span>}
              </span>
              <span className="text-sm text-pfSubtle" style={mono}>
                {c ? `${euro.format(c.oneTimeCents / 100)} + ${euro.format(c.monthlyCents / 100)}/Monat × ${COMMISSION_MONTHS} (${lead.commissionPercentAtWin} %)${lead.wonAt ? ` · bis ${dateFmt.format(endOfCommission(lead.wonAt))}` : ""}` : "Satz nicht vereinbart"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function endOfCommission(wonAt: string): Date {
  const d = new Date(wonAt);
  d.setMonth(d.getMonth() + COMMISSION_MONTHS);
  return d;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cardClass}>
      <div className="label-mono mb-2">{label}</div>
      <div className="text-2xl text-pfText">{value}</div>
    </div>
  );
}
