"use client";

import { useEffect, useMemo, useState } from "react";

type StatusResponse = {
  running: boolean;
  date: string;
  run_id: string;
  reports: {
    validation: null | {
      selected_plz: null | { plz: string; ort?: string };
      count: number;
      summary: Record<string, number> | null;
    };
    gate: null | { total: number; approved: number; manual_review: number };
    send: null | {
      trigger: string | null;
      live: boolean;
      daily_limit: number | null;
      daily_limit_applies: boolean;
      sendable_from_gate: number;
      sent: number;
      errors: number;
      skipped_daily_limit: number;
      skipped_blocked: number;
    };
  };
  sent_contacts: {
    total: number;
    bounced: number;
    items: SentContact[];
  };
  log_tail: string | null;
};

type SentContact = {
  contact_id: string;
  sent_at: string;
  trigger: string | null;
  subject: string | null;
  message_count: number;
  company: string;
  website: string | null;
  lead_email: string | null;
  contacted_email: string | null;
  domain: string | null;
  contact_status: string;
  bounced: number;
  first_contact_at: string | null;
  last_reply_at: string | null;
  reply_tag: string | null;
  reply_tag_reason: string | null;
};

function stat(label: string, value: string | number) {
  return (
    <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
      <div className="text-[0.65rem] font-mono uppercase tracking-widest text-pfMuted">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-pfText">{value}</div>
    </div>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function websiteHref(website: string | null) {
  if (!website) return null;
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function statusClass(contact: SentContact) {
  if (contact.bounced) return "border-red-400/30 bg-red-500/10 text-red-200";
  if (contact.last_reply_at) return "border-blue-400/30 bg-blue-500/10 text-blue-200";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
}

export default function OutreachAdminPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/status", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Status fehlgeschlagen (${res.status})`);
      setStatus(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function startRun() {
    const ok = window.confirm(
      hasApprovedDryRun
        ? "Die freigegebenen Leads aus dem sichtbaren Dry-Run jetzt live senden?"
        : "Bis zu 10 echte Mails senden? Der Lauf nutzt lokale Claude/Codex-Batch-Gates und sendet nur beidseitig freigegebene Leads.",
    );
    if (!ok) return;

    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: hasApprovedDryRun ? "send_latest_approved" : "run_new" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Start fehlgeschlagen (${res.status})`);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadStatus();
    }, status?.running ? 3000 : 15000);
    return () => window.clearInterval(interval);
  }, [status?.running]);

  const plzLabel = useMemo(() => {
    const selected = status?.reports.validation?.selected_plz;
    if (!selected) return "-";
    return selected.ort ? `${selected.plz} ${selected.ort}` : selected.plz;
  }, [status]);

  const hasApprovedDryRun =
    status?.reports.send?.live === false &&
    (status.reports.send?.sendable_from_gate || 0) > 0 &&
    (status.reports.send?.sent || 0) === 0 &&
    (status.reports.send?.errors || 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-pfBorder bg-pfSurface/40 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="label-mono mb-2">Manual Outreach</div>
          <p className="text-sm text-pfSubtle">
            Sendet den freigegebenen Dry-Run oder startet einen neuen gated 10-Lead-Lauf.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-pfSubtle">
            <span className={`h-2.5 w-2.5 rounded-full ${status?.running ? "bg-amber-400" : "bg-green-400"}`} />
            {status?.running ? "Laeuft" : "Bereit"}
          </div>
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="rounded-sm border border-pfBorder px-4 py-2 text-xs font-mono uppercase tracking-widest text-pfText transition hover:border-pfAccent hover:text-pfAccent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Laedt..." : "Aktualisieren"}
          </button>
          <button
            type="button"
            onClick={startRun}
            disabled={starting || status?.running}
            className="btn-accent px-4 py-2 text-xs"
          >
            {starting ? "Startet..." : hasApprovedDryRun ? "Freigegebene Leads senden" : "Bis zu 10 Leads suchen & senden"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stat("Datum", status?.date || "-")}
        {stat("Run", status?.run_id || "-")}
        {stat("PLZ", plzLabel)}
        {stat("Gate Approved", status?.reports.gate?.approved ?? "-")}
        {stat("Gesendet", status?.reports.send?.sent ?? "-")}
        {stat("Kontakte", status?.sent_contacts.total ?? "-")}
        {stat("Bounces", status?.sent_contacts.bounced ?? "-")}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-5">
          <div className="text-[0.65rem] font-mono uppercase tracking-widest text-pfMuted">Validierung</div>
          <div className="mt-3 text-3xl font-semibold text-pfText">{status?.reports.validation?.count ?? "-"}</div>
          <div className="mt-3 text-sm text-pfSubtle">
            pass {status?.reports.validation?.summary?.pass ?? "-"} / review {status?.reports.validation?.summary?.review ?? "-"} / reject {status?.reports.validation?.summary?.reject ?? "-"}
          </div>
        </div>
        <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-5">
          <div className="text-[0.65rem] font-mono uppercase tracking-widest text-pfMuted">Gate</div>
          <div className="mt-3 text-3xl font-semibold text-pfText">{status?.reports.gate?.total ?? "-"}</div>
          <div className="mt-3 text-sm text-pfSubtle">manual_review {status?.reports.gate?.manual_review ?? "-"}</div>
        </div>
        <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-5">
          <div className="text-[0.65rem] font-mono uppercase tracking-widest text-pfMuted">Versand</div>
          <div className="mt-3 text-3xl font-semibold text-pfText">{status?.reports.send?.sendable_from_gate ?? "-"}</div>
          <div className="mt-3 text-sm text-pfSubtle">
            Fehler {status?.reports.send?.errors ?? "-"} / blockiert {status?.reports.send?.skipped_blocked ?? "-"} / Limit {status?.reports.send?.skipped_daily_limit ?? "-"}
          </div>
          <div className="mt-3 text-xs font-mono text-pfMuted">
            {status?.reports.send?.daily_limit_applies === false ? "Manual-Lauf ohne Tagesbudget-Verbrauch" : "Routine-Tagesbudget aktiv"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label-mono">Angeschriebene Unternehmen</div>
            <div className="mt-1 text-sm text-pfSubtle">
              {status?.sent_contacts.total ?? 0} Kontakte mit gespeicherter Lead-Website
            </div>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-pfMuted">
            {status?.sent_contacts.bounced ?? 0} bounced
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-pfBorder">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-pfBorder bg-black/30 text-[0.65rem] font-mono uppercase tracking-widest text-pfMuted">
              <tr>
                <th className="px-4 py-3">Unternehmen</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Gesendet</th>
                <th className="px-4 py-3">Betreff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pfBorder">
              {!status ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-pfMuted">
                    Laedt...
                  </td>
                </tr>
              ) : status.sent_contacts.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-pfMuted">
                    Noch keine echten Outreach-Mails.
                  </td>
                </tr>
              ) : (
                status.sent_contacts.items.map((contact) => {
                  const href = websiteHref(contact.website);
                  return (
                    <tr key={contact.contact_id} className="align-top transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-pfText">{contact.company}</div>
                        <div className="mt-1 text-xs text-pfMuted">{contact.domain || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-pfAccent hover:underline"
                          >
                            {contact.website}
                          </a>
                        ) : (
                          <span className="text-pfMuted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="break-all text-pfText">{contact.contacted_email || contact.lead_email || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${statusClass(contact)}`}>
                          {contact.bounced ? "bounced" : contact.last_reply_at ? "replied" : contact.contact_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-pfSubtle">{formatDateTime(contact.sent_at)}</td>
                      <td className="px-4 py-3 text-pfSubtle">{contact.subject || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-pfBorder bg-black/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="label-mono">Run Log</div>
          <div className="text-xs font-mono uppercase tracking-widest text-pfMuted">{loading ? "laedt" : "aktuell"}</div>
        </div>
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-200">
          {status?.log_tail || "Noch kein Tageslog."}
        </pre>
      </div>
    </div>
  );
}
