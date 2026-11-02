"use client";

import { useCallback, useEffect, useState } from "react";
import { cardClass, CopyButton, dateTimeFmt, inputClass, labelClass, mono, Pill, sendJson } from "./ui";

type Demo = {
  id: string; state: "REQUESTED" | "IN_PROGRESS" | "READY" | "SENT" | "CANCELLED";
  packageInterest: string | null; briefing: string; customerEmail: string; meetingAt: string | null; demoUrl: string | null;
  adminNote: string | null; sentMessage: string | null; readyAt: string | null; sentAt: string | null; createdAt: string;
  salesLead: { id: string; companyName: string; contactName: string | null; phone: string | null; website: string | null; status: string };
  requestedBy: { id: string; email: string; name: string | null };
  draftMessage: string | null;
};

const STATE_LABEL: Record<Demo["state"], string> = {
  REQUESTED: "Angefragt", IN_PROGRESS: "In Arbeit", READY: "Fertig – senden", SENT: "An Kunde gesendet", CANCELLED: "Abgebrochen",
};
const STATE_TONE: Record<Demo["state"], "muted" | "accent" | "success" | "danger"> = {
  REQUESTED: "accent", IN_PROGRESS: "accent", READY: "success", SENT: "muted", CANCELLED: "danger",
};

export default function DemosView({ isAdmin }: { isAdmin: boolean }) {
  const [demos, setDemos] = useState<Demo[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const data = await sendJson("/api/sales/demos", "GET");
      setDemos(data.demos);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (err) return <p className="text-pfDanger" role="alert">{err}</p>;
  if (!demos) return <p className="text-pfSubtle">Lade Demos …</p>;

  const order: Demo["state"][] = isAdmin ? ["REQUESTED", "IN_PROGRESS", "READY", "SENT", "CANCELLED"] : ["READY", "REQUESTED", "IN_PROGRESS", "SENT", "CANCELLED"];
  const sorted = [...demos].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));

  return (
    <div className="space-y-4">
      <div className={`${cardClass} text-sm text-pfSubtle`}>
        {isAdmin
          ? "Neue Anfragen kommen per Mail und Discord. Demo bauen, Link eintragen, auf „Fertig“ – der Vertriebler bekommt eine Mail und schickt die Demo an den Kunden."
          : "Sobald Fabian eine Demo fertig hat, bekommst du eine Mail und sie erscheint hier. Text prüfen, auf „An Kunden senden“ – der Kunde kann direkt auf deine Adresse antworten."}
      </div>
      {sorted.length === 0 ? (
        <p className="text-pfSubtle">Noch keine Demo-Anfragen. Sie entstehen im Gesprächsprotokoll über „Demo gewünscht“.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((d) => (
            <DemoCard key={d.id} demo={d} isAdmin={isAdmin} onChanged={load} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DemoCard({ demo, isAdmin, onChanged }: { demo: Demo; isAdmin: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(demo.state === "READY" || (isAdmin && demo.state === "REQUESTED"));
  const [url, setUrl] = useState(demo.demoUrl || "");
  const [note, setNote] = useState(demo.adminNote || "");
  const [message, setMessage] = useState(demo.draftMessage || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={cardClass} data-testid="demo-card">
      <button type="button" className="flex w-full flex-wrap items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="min-w-0">
          <div className="text-pfText">{demo.salesLead.companyName}</div>
          <div className="mt-1 break-all text-xs text-pfSubtle">
            {[demo.salesLead.contactName, demo.customerEmail, demo.salesLead.phone].filter(Boolean).join(" · ")}
          </div>
          {isAdmin && <div className="mt-1 text-xs text-pfMuted" style={mono}>{demo.requestedBy.name || demo.requestedBy.email} · {dateTimeFmt.format(new Date(demo.createdAt))}</div>}
        </div>
        <Pill tone={STATE_TONE[demo.state]}>{STATE_LABEL[demo.state]}</Pill>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-pfBorder pt-4">
          <div>
            <div className="label-mono mb-1">Briefing {demo.packageInterest ? `· Paket ${demo.packageInterest}` : ""}</div>
            <p className="whitespace-pre-wrap text-sm text-pfText">{demo.briefing}</p>
            {demo.salesLead.website && <p className="mt-2 break-all text-xs text-pfSubtle">Bisherige Website: {demo.salesLead.website}</p>}
            {demo.meetingAt && <p className="mt-1 text-xs text-pfSubtle">Besprechung: {dateTimeFmt.format(new Date(demo.meetingAt))}</p>}
          </div>

          {demo.demoUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <a href={demo.demoUrl} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-pfAccent hover:underline">{demo.demoUrl}</a>
              <CopyButton value={demo.demoUrl} label="Link kopieren" />
            </div>
          )}
          {demo.adminNote && !isAdmin && <p className="text-sm text-pfSubtle">Hinweis von Fabian: {demo.adminNote}</p>}

          {isAdmin && (demo.state === "REQUESTED" || demo.state === "IN_PROGRESS" || demo.state === "READY") && (
            <div className="space-y-3">
              <label className={labelClass}>Demo-Link (https://…)<input className={`${inputClass} mt-1`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://demo.pagefoundry.de/…" /></label>
              <label className={labelClass}>Hinweis an den Vertriebler (optional)<textarea className={`${inputClass} mt-1 min-h-[60px]`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} /></label>
              <div className="flex flex-wrap gap-2">
                {demo.state === "REQUESTED" && (
                  <button type="button" disabled={busy} className="rounded-sm border border-pfBorder px-3 py-2 text-xs text-pfText hover:border-pfBorderAccent" onClick={() => run(() => sendJson(`/api/sales/demos/${demo.id}`, "PATCH", { state: "IN_PROGRESS", adminNote: note }))}>In Arbeit</button>
                )}
                <button type="button" disabled={busy} className="btn-accent px-4 py-2 text-[0.62rem]" onClick={() => run(() => sendJson(`/api/sales/demos/${demo.id}`, "PATCH", { state: "READY", demoUrl: url, adminNote: note }))}>
                  {demo.state === "READY" ? "Link aktualisieren" : "Fertig – an Vertrieb melden"}
                </button>
                <button type="button" disabled={busy} className="rounded-sm border border-pfBorder px-3 py-2 text-xs text-pfDanger hover:border-pfDanger" onClick={() => run(() => sendJson(`/api/sales/demos/${demo.id}`, "PATCH", { state: "CANCELLED", adminNote: note }))}>Abbrechen</button>
              </div>
            </div>
          )}

          {!isAdmin && demo.state === "READY" && (
            <div className="space-y-3">
              <label className={labelClass}>
                Nachricht an {demo.customerEmail}
                <textarea className={`${inputClass} mt-1 min-h-[260px] font-[inherit]`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={6000} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} className="btn-accent px-4 py-2 text-[0.62rem]" onClick={() => run(() => sendJson(`/api/sales/demos/${demo.id}/send`, "POST", { message }))}>
                  {busy ? "Sende …" : "An Kunden senden"}
                </button>
                <CopyButton value={message} label="Text kopieren" />
              </div>
              <p className="text-xs text-pfMuted">Absender ist PageFoundry, Antworten gehen an deine Adresse.</p>
            </div>
          )}
          {demo.state === "SENT" && demo.sentAt && (
            <p className="text-sm text-pfSuccess">Gesendet am {dateTimeFmt.format(new Date(demo.sentAt))}. Ein Nachfass-Anruf ist automatisch in drei Werktagen eingeplant und erscheint dann unter „Anrufe heute“.</p>
          )}
          {err && <p className="text-sm text-pfDanger" role="alert">{err}</p>}
        </div>
      )}
    </li>
  );
}
