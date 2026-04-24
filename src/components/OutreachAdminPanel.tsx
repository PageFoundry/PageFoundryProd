"use client";

import { useEffect, useMemo, useState } from "react";

type StatusResponse = {
  running: boolean;
  date: string;
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
  log_tail: string | null;
};

function stat(label: string, value: string | number) {
  return (
    <div className="rounded-xl border border-pfBorder bg-pfSurface/40 p-4">
      <div className="text-[0.65rem] font-mono uppercase tracking-widest text-pfMuted">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-pfText">{value}</div>
    </div>
  );
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
    const ok = window.confirm("Bis zu 5 echte Mails senden? Der Lauf nutzt 0 Claude-Routine-Runs und 1 lokalen Claude-Aufruf.");
    if (!ok) return;

    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/run", { method: "POST" });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-pfBorder bg-pfSurface/40 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="label-mono mb-2">Manual Outreach</div>
          <p className="text-sm text-pfSubtle">
            Startet den bestehenden Outreach-Daily-Run manuell fuer bis zu 5 Leads einer PLZ.
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
            {starting ? "Startet..." : "5 Leads anschreiben"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stat("Datum", status?.date || "-")}
        {stat("PLZ", plzLabel)}
        {stat("Gate Approved", status?.reports.gate?.approved ?? "-")}
        {stat("Gesendet", status?.reports.send?.sent ?? "-")}
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
