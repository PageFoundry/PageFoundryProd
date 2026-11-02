"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cardClass, Choice, dateTimeFmt, inputClass, labelClass, mono, Pill, sendJson } from "./ui";

type Entry = {
  id: string; rank: number; tier: "A" | "B" | "C"; status: "OPEN" | "DONE" | "EXPIRED" | "BLOCKED";
  companyName: string; city: string | null; plz: string | null; phoneDisplay: string; isMobile: boolean;
  website: string | null; reasonText: string; salesLeadId: string | null; searchUrl: string; demoUrl: string; opener: string;
};
type Task = {
  id: string; kind: "CALLBACK" | "RETRY"; nextAttemptAt: string; failedAttempts: number;
  lead: { id: string; companyName: string; contactName: string | null; phoneDisplay: string | null; website: string | null; status: string;
    lastLog: { reached: string; outcome: string | null; notes: string | null; contactName: string | null; createdAt: string } | null };
};
type View = {
  admin: false; day: string;
  batch: { state: "GENERATING" | "READY" | "FAILED"; targetCount: number; actualCount: number; note: string | null; entries: Entry[] };
  tasks: Task[];
};
type AdminView = { admin: true; batches: Array<{ id: string; state: string; actualCount: number; note: string | null; owner: { email: string; name: string | null }; entries: Array<{ id: string; rank: number; tier: string; companyName: string; city: string | null; status: string; reasonText: string }> }> };

type Attempt = { attemptId: string; phone: string; phoneDisplay: string; expiresAt: string; salesLeadId: string; reasonText: string };
type Target = { kind: "entry"; entry: Entry } | { kind: "task"; task: Task };

const TIER_LABEL = { A: "Website kaputt", B: "Website schwach", C: "Keine Website" } as const;
const TIER_TONE = { A: "danger", B: "accent", C: "muted" } as const;
const STATUS_LABEL = { OPEN: "Offen", DONE: "Erledigt", EXPIRED: "Verfallen", BLOCKED: "Gesperrt" } as const;

const GUIDE_QUESTIONS = [
  "Wie finden neue Kunden Sie heute hauptsächlich?",
  "Wer kümmert sich bei Ihnen um die Website bzw. den Online-Auftritt?",
  "Was wäre Ihnen an einer Website am wichtigsten (Anfragen, Termine, Vertrauen, Stellenanzeigen)?",
  "Darf ich Ihnen eine kostenlose Demo-Seite für Ihren Betrieb zeigen? Das dauert 15 Minuten.",
];
const OBJECTION_ANSWERS: Record<string, string> = {
  PRICE: "Die Demo ist kostenlos und unverbindlich, danach sehen Sie die Festpreise und entscheiden in Ruhe.",
  NO_TIME: "Kein Problem. Wann passt es Ihnen besser? Dann rufe ich zu dem Zeitpunkt noch einmal an.",
  HAS_PROVIDER: "Gut, dass Sie versorgt sind. Sind Sie mit den Anfragen über die Seite zufrieden?",
  NO_NEED: "Danke für die offene Antwort. Darf ich mich in ein paar Monaten melden, oder lieber gar nicht mehr?",
};

export default function CallsView({ repName }: { repName: string }) {
  const [view, setView] = useState<View | AdminView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<{ target: Target; attempt: Attempt } | null>(null);
  const [showDone, setShowDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drafts = DRAFTS;

  const load = useCallback(async () => {
    try {
      const data = await sendJson("/api/sales/calls", "GET");
      setView(data);
      setError(null);
      if (!data.admin && data.batch.state === "GENERATING") timer.current = setTimeout(load, 3000);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  if (error) return <p className="text-pfDanger" role="alert">{error}</p>;
  if (!view) return <p className="text-pfSubtle">Lade Anrufliste …</p>;
  if (view.admin) return <AdminCalls view={view} />;

  const { batch, tasks } = view;
  const open = batch.entries.filter((e) => e.status === "OPEN");
  const done = batch.entries.filter((e) => e.status !== "OPEN");
  const dueTasks = tasks.filter((t) => new Date(t.nextAttemptAt).getTime() <= Date.now() + 15 * 60_000);
  const laterTasks = tasks.filter((t) => !dueTasks.includes(t));

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Heute offen" value={batch.state === "READY" ? `${open.length} / ${batch.actualCount}` : "…"} />
        <Stat label="Erledigt" value={String(done.length)} />
        <Stat label="Rückrufe fällig" value={String(dueTasks.length)} />
      </div>

      {dueTasks.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg text-pfText">Rückrufe & Wiedervorlagen</h2>
          <ul className="space-y-3">
            {dueTasks.map((t) => (
              <TaskCard key={t.id} task={t} onAttempt={(attempt) => setActive({ target: { kind: "task", task: t }, attempt })} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg text-pfText">Anrufliste heute</h2>
          <span className="text-xs text-pfMuted" style={mono}>Sortiert: kaputte Website → schwache Website → keine Website</span>
        </div>
        {batch.state === "GENERATING" && (
          <div className={`${cardClass} text-sm text-pfSubtle`} role="status">
            Die Liste für heute wird erstellt: Kontakte werden ausgewählt und ihre Websites live geprüft. Das dauert ein bis drei Minuten. Die Seite aktualisiert sich von selbst.
          </div>
        )}
        {batch.state === "FAILED" && (
          <div className={`${cardClass} space-y-3`} role="alert">
            <p className="text-sm text-pfDanger">{batch.note || "Die Liste konnte nicht erstellt werden."}</p>
            <button type="button" className="btn-accent px-4 py-2 text-[0.62rem]" onClick={load}>Erneut versuchen</button>
          </div>
        )}
        {batch.state === "READY" && (
          <>
            {batch.note && <p className="mb-3 text-sm text-pfSubtle">{batch.note}</p>}
            {open.length === 0 ? (
              <p className="text-pfSubtle">Alle Kontakte für heute sind erledigt. Morgen gibt es eine neue Liste.</p>
            ) : (
              <ul className="space-y-3">
                {open.map((e) => (
                  <EntryCard key={e.id} entry={e} onAttempt={(attempt) => setActive({ target: { kind: "entry", entry: e }, attempt })} onChanged={load} />
                ))}
              </ul>
            )}
            {done.length > 0 && (
              <div className="mt-6">
                <button type="button" className="text-sm text-pfAccent hover:underline" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
                  {showDone ? "Erledigte ausblenden" : `Erledigte anzeigen (${done.length})`}
                </button>
                {showDone && (
                  <ul className="mt-3 space-y-2">
                    {done.map((e) => (
                      <li key={e.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-2 py-3`}>
                        <span className="text-pfText">{e.companyName}</span>
                        <Pill tone={e.status === "BLOCKED" ? "danger" : "muted"}>{STATUS_LABEL[e.status]}</Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {laterTasks.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg text-pfText">Später heute</h2>
          <ul className="space-y-2">
            {laterTasks.map((t) => (
              <li key={t.id} className={`${cardClass} flex flex-wrap items-center justify-between gap-2 py-3`}>
                <span className="text-pfText">{t.lead.companyName}</span>
                <span className="text-xs text-pfSubtle" style={mono}>{t.kind === "CALLBACK" ? "Rückruf" : "Neuer Versuch"} {dateTimeFmt.format(new Date(t.nextAttemptAt))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {active && (
        <CallModal
          target={active.target}
          attempt={active.attempt}
          repName={repName}
          initial={drafts.get(active.attempt.attemptId)}
          onClose={(draft) => {
            drafts.set(active.attempt.attemptId, draft);
            setActive(null);
          }}
          onSaved={() => {
            drafts.delete(active.attempt.attemptId);
            setActive(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cardClass}>
      <div className="label-mono mb-2">{label}</div>
      <div className="text-2xl text-pfText">{value}</div>
    </div>
  );
}

function siteHref(w: string) {
  return /^https?:\/\//i.test(w) ? w : `http://${w}`;
}

function ConfirmAndCall({ onConfirm, label = "Anrufen" }: { onConfirm: () => Promise<void>; label?: string }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-3 rounded-sm border border-pfBorder bg-pfBg p-3">
      <label className="flex cursor-pointer items-start gap-3 text-sm text-pfText">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--pf-accent,#c9a84d)]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>Anrufgrund geprüft und passend. Gegenüber ist ein Unternehmen, keine Privatperson.</span>
      </label>
      <button
        type="button"
        disabled={!checked || busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await onConfirm();
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        className="btn-accent w-full px-4 py-3 text-[0.7rem] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {busy ? "Prüfe …" : label}
      </button>
      {err && <p className="text-sm text-pfDanger" role="alert">{err}</p>}
    </div>
  );
}

function EntryCard({ entry, onAttempt, onChanged }: { entry: Entry; onAttempt: (a: Attempt) => void; onChanged: () => void }) {
  const [open, setOpen] = useState(entry.rank === 1);
  return (
    <li className={cardClass} data-testid="call-entry">
      <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-pfMuted" style={mono}>#{entry.rank}</span>
            <span className="text-pfText">{entry.companyName}</span>
          </div>
          <div className="mt-1 text-xs text-pfSubtle">
            {[entry.city, entry.plz].filter(Boolean).join(" · ")} · {entry.phoneDisplay}
            {entry.isMobile && " (Mobil)"}
          </div>
        </div>
        <Pill tone={TIER_TONE[entry.tier]}>{TIER_LABEL[entry.tier]}</Pill>
      </button>
      {open && (
        <div className="mt-4 space-y-4 border-t border-pfBorder pt-4">
          <div>
            <div className="label-mono mb-1">Anrufgrund</div>
            <p className="text-sm text-pfText">{entry.reasonText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.website && (
              <a href={siteHref(entry.website)} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-pfBorder px-3 py-2 text-xs text-pfText hover:border-pfBorderAccent">
                Aktuelle Website ansehen
              </a>
            )}
            <a href={entry.searchUrl} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-pfBorder px-3 py-2 text-xs text-pfText hover:border-pfBorderAccent">
              Neue Website suchen
            </a>
            <a href={entry.demoUrl} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-pfBorder px-3 py-2 text-xs text-pfText hover:border-pfBorderAccent">
              Passende Beispiel-Demo
            </a>
          </div>
          <ConfirmAndCall
            onConfirm={async () => {
              try {
                const a: Attempt = await sendJson("/api/sales/calls/confirm", "POST", { entryId: entry.id, confirmed: true });
                onAttempt(a);
              } catch (e) {
                if ((e as { status?: number }).status === 409) onChanged();
                throw e;
              }
            }}
          />
        </div>
      )}
    </li>
  );
}

function TaskCard({ task, onAttempt }: { task: Task; onAttempt: (a: Attempt) => void }) {
  const last = task.lead.lastLog;
  return (
    <li className={`${cardClass} space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-pfText">{task.lead.companyName}</div>
          <div className="mt-1 text-xs text-pfSubtle">
            {task.lead.contactName ? `${task.lead.contactName} · ` : ""}{task.lead.phoneDisplay}
          </div>
        </div>
        <Pill tone="accent">{task.kind === "CALLBACK" ? "Rückruf" : `Versuch ${task.failedAttempts + 1}/3`}</Pill>
      </div>
      <p className="text-xs text-pfSubtle" style={mono}>Fällig {dateTimeFmt.format(new Date(task.nextAttemptAt))}</p>
      {last?.notes && <p className="text-sm text-pfSubtle">Letzte Notiz: {last.notes}</p>}
      <ConfirmAndCall
        label="Erneut anrufen"
        onConfirm={async () => {
          const a: Attempt = await sendJson("/api/sales/calls/confirm", "POST", { taskId: task.id, confirmed: true });
          onAttempt(a);
        }}
      />
    </li>
  );
}

type Form = {
  reached?: "NOT_REACHED" | "VOICEMAIL" | "WRONG_NUMBER" | "REACHED";
  outcome?: "NO_INTEREST" | "CALLBACK" | "DEMO_BOOKED" | "OFFER_REQUESTED" | "DO_NOT_CALL" | "HAS_NEW_WEBSITE";
  contactName: string; contactRole: string; isDecisionMaker?: "yes" | "no";
  callbackAt: string; demoAt: string; painPoint: string; websiteSituation: string; budgetRange: string;
  objection?: "PRICE" | "NO_TIME" | "HAS_PROVIDER" | "NO_NEED" | "OTHER"; objectionText: string; notes: string; newWebsite: string;
  demoEmail: string; demoBriefing: string; packageInterest?: "sichtbar" | "gefunden" | "gebucht" | "unklar";
};

// Entwuerfe pro Anrufversuch auf Modulebene: ueberleben "Spaeter" und Tab-Wechsel, solange die
// Seite offen ist (bewusst kein localStorage – Gespraechsnotizen sind personenbezogen).
const DRAFTS = new Map<string, Form>();

const emptyForm: Form = { contactName: "", contactRole: "", callbackAt: "", demoAt: "", painPoint: "", websiteSituation: "", budgetRange: "", objectionText: "", notes: "", newWebsite: "", demoEmail: "", demoBriefing: "" };

function toIso(local: string) {
  return local ? new Date(local).toISOString() : undefined;
}

function CallModal({ target, attempt, repName, initial, onClose, onSaved }: { target: Target; attempt: Attempt; repName: string; initial?: Form; onClose: (draft: Form) => void; onSaved: () => void }) {
  const [f, setF] = useState<Form>(initial ?? emptyForm);
  const fRef = useRef(f);
  fRef.current = f;
  const close = useCallback(() => onClose(fRef.current), [onClose]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Mobil eingeklappt: dort haelt Connor das Handy beim Telefonieren am Ohr.
  const [guideOpen, setGuideOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 640));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const company = target.kind === "entry" ? target.entry.companyName : target.task.lead.companyName;
  const opener = target.kind === "entry" ? target.entry.opener.replace("{REP}", repName) : `Guten Tag, hier ist ${repName} von PageFoundry, wir hatten ${target.task.kind === "CALLBACK" ? "einen Rückruf vereinbart" : "es neulich schon einmal versucht"}.`;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close]);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        attemptId: attempt.attemptId,
        reached: f.reached,
        outcome: f.reached === "REACHED" ? f.outcome : undefined,
        contactName: f.contactName || undefined,
        contactRole: f.contactRole || undefined,
        isDecisionMaker: f.isDecisionMaker ? f.isDecisionMaker === "yes" : undefined,
        callbackAt: f.outcome === "CALLBACK" ? toIso(f.callbackAt) : undefined,
        demoAt: f.outcome === "DEMO_BOOKED" ? toIso(f.demoAt) : undefined,
        painPoint: f.painPoint || undefined,
        websiteSituation: f.websiteSituation || undefined,
        budgetRange: f.budgetRange || undefined,
        objection: f.objection,
        objectionText: f.objectionText || undefined,
        notes: f.notes || undefined,
        newWebsite: f.outcome === "HAS_NEW_WEBSITE" ? f.newWebsite : undefined,
        demoEmail: f.outcome === "DEMO_BOOKED" ? f.demoEmail : undefined,
        demoBriefing: f.outcome === "DEMO_BOOKED" ? f.demoBriefing : undefined,
        packageInterest: f.outcome === "DEMO_BOOKED" ? f.packageInterest : undefined,
      };
      await sendJson("/api/sales/calls/log", "POST", body);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const reached = f.reached === "REACHED";
  const canSave = Boolean(f.reached) && (!reached || Boolean(f.outcome));

  // Portal nach <body>: Eltern der Seite bilden eigene Stacking-Kontexte, sonst liegt
  // die fixe Navigationsleiste ueber dem Fenster.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6" role="presentation">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-modal-title"
        className="flex h-full w-full flex-col overflow-hidden border border-pfBorder bg-pfCard outline-none sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-sm"
      >
        <header className="flex items-start justify-between gap-3 border-b border-pfBorder p-4">
          <div className="min-w-0">
            <div className="label-mono mb-1">Gespräch</div>
            <h2 id="call-modal-title" className="truncate text-lg text-pfText">{company}</h2>
            <a
              href={`tel:${attempt.phone}`}
              className="btn-accent mt-3 inline-flex items-center gap-2 px-4 py-3 text-[0.75rem]"
              style={mono}
              aria-label={`Jetzt wählen: ${attempt.phoneDisplay}`}
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>
              {attempt.phoneDisplay} wählen
            </a>
          </div>
          <button type="button" onClick={close} className="rounded-sm border border-pfBorder px-3 py-2 text-xs text-pfSubtle hover:text-pfAccent" aria-label="Schließen (Protokoll später)">
            Später
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">
          <section className="rounded-sm border border-pfBorderAccent bg-pfBg p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setGuideOpen(!guideOpen)} aria-expanded={guideOpen}>
              <span className="label-mono">Leitfaden</span>
              <span className="text-xs text-pfSubtle">{guideOpen ? "einklappen" : "ausklappen"}</span>
            </button>
            {guideOpen && (
              <div className="mt-3 space-y-3 text-sm">
                <p className="border-l-2 border-pfAccent pl-3 text-pfText">„{opener}“</p>
                <p className="text-xs text-pfSubtle">Anrufgrund: {attempt.reasonText}</p>
                <ol className="list-decimal space-y-1 pl-5 text-pfSubtle">
                  {GUIDE_QUESTIONS.map((q) => <li key={q}>{q}</li>)}
                </ol>
                <p className="text-xs text-pfMuted">Will das Gegenüber keine Anrufe mehr: sofort zusagen und unten „Nicht mehr anrufen“ wählen. Das sperrt Telefon und E-Mail-Werbung.</p>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <div className="label-mono">1 · Erreicht?</div>
            <Choice
              name="Erreicht"
              value={f.reached}
              onChange={(v) => set("reached", v)}
              options={[
                { value: "REACHED", label: "Gesprochen" },
                { value: "NOT_REACHED", label: "Nicht erreicht" },
                { value: "VOICEMAIL", label: "Mailbox" },
                { value: "WRONG_NUMBER", label: "Falsche Nummer" },
              ]}
            />
            {(f.reached === "NOT_REACHED" || f.reached === "VOICEMAIL") && (
              <p className="text-xs text-pfSubtle">Wird am nächsten Werktag um 9 Uhr wieder vorgelegt, höchstens drei Versuche insgesamt.</p>
            )}
          </section>

          {reached && (
            <>
              <section className="space-y-3">
                <div className="label-mono">2 · Mit wem gesprochen?</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Name<input className={`${inputClass} mt-1`} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} maxLength={200} /></label>
                  <label className={labelClass}>Rolle (Inhaber, Büro …)<input className={`${inputClass} mt-1`} value={f.contactRole} onChange={(e) => set("contactRole", e.target.value)} maxLength={120} /></label>
                </div>
                <Choice name="Entscheider" value={f.isDecisionMaker} onChange={(v) => set("isDecisionMaker", v)} options={[{ value: "yes", label: "Entscheider" }, { value: "no", label: "Kein Entscheider" }]} />
              </section>

              <section className="space-y-3">
                <div className="label-mono">3 · Ergebnis</div>
                <Choice
                  name="Ergebnis"
                  value={f.outcome}
                  onChange={(v) => set("outcome", v)}
                  options={[
                    { value: "DEMO_BOOKED", label: "Demo gewünscht", hint: "Fabian baut eine Demo" },
                    { value: "OFFER_REQUESTED", label: "Angebot gewünscht" },
                    { value: "CALLBACK", label: "Rückruf vereinbart" },
                    { value: "NO_INTEREST", label: "Kein Interesse" },
                    { value: "HAS_NEW_WEBSITE", label: "Hat neue Website" },
                    { value: "DO_NOT_CALL", label: "Nicht mehr anrufen", hint: "Sperrt Telefon + E-Mail" },
                  ]}
                />
                {f.outcome === "DEMO_BOOKED" && (
                  <div className="space-y-3 rounded-sm border border-pfBorder p-3">
                    <label className={labelClass}>E-Mail für den Demo-Link *<input type="email" className={`${inputClass} mt-1`} value={f.demoEmail} onChange={(e) => set("demoEmail", e.target.value)} maxLength={320} required /></label>
                    <label className={labelClass}>
                      Briefing für Fabian * (Was macht der Betrieb? Was ist wichtig? Logo/Farben? Besonderheiten?)
                      <textarea className={`${inputClass} mt-1 min-h-[110px]`} value={f.demoBriefing} onChange={(e) => set("demoBriefing", e.target.value)} maxLength={4000} />
                    </label>
                    <label className={labelClass}>
                      Paket-Interesse
                      <select className={`${inputClass} mt-1`} value={f.packageInterest || ""} onChange={(e) => set("packageInterest", (e.target.value || undefined) as Form["packageInterest"])}>
                        <option value="">unklar</option>
                        <option value="sichtbar">Sichtbar (Onepager)</option>
                        <option value="gefunden">Gefunden (bis 5 Seiten + SEO)</option>
                        <option value="gebucht">Gebucht (Buchung/Anfrage/Shop)</option>
                      </select>
                    </label>
                    <label className={labelClass}>Besprechungstermin (optional)<input type="datetime-local" className={`${inputClass} mt-1`} value={f.demoAt} onChange={(e) => set("demoAt", e.target.value)} /></label>
                  </div>
                )}
                {f.outcome === "CALLBACK" && (
                  <label className={labelClass}>Rückruf am *<input type="datetime-local" className={`${inputClass} mt-1`} value={f.callbackAt} onChange={(e) => set("callbackAt", e.target.value)} required /></label>
                )}
                {f.outcome === "HAS_NEW_WEBSITE" && (
                  <label className={labelClass}>Neue Website *<input className={`${inputClass} mt-1`} placeholder="firma.de" value={f.newWebsite} onChange={(e) => set("newWebsite", e.target.value)} maxLength={512} /></label>
                )}
                {f.outcome === "DO_NOT_CALL" && <p className="text-sm text-pfDanger">Der Kontakt wird dauerhaft für Anrufe und E-Mail-Werbung gesperrt.</p>}
              </section>

              {(f.outcome === "NO_INTEREST" || f.outcome === "CALLBACK" || f.outcome === "OFFER_REQUESTED") && (
                <section className="space-y-3">
                  <div className="label-mono">Einwand</div>
                  <Choice
                    name="Einwand"
                    value={f.objection}
                    onChange={(v) => set("objection", v)}
                    options={[
                      { value: "PRICE", label: "Zu teuer" },
                      { value: "NO_TIME", label: "Keine Zeit" },
                      { value: "HAS_PROVIDER", label: "Hat Anbieter" },
                      { value: "NO_NEED", label: "Kein Bedarf" },
                      { value: "OTHER", label: "Anderes" },
                    ]}
                  />
                  {f.objection && OBJECTION_ANSWERS[f.objection] && <p className="text-xs text-pfSubtle">Antwortidee: {OBJECTION_ANSWERS[f.objection]}</p>}
                  <input className={inputClass} placeholder="Einwand in eigenen Worten (optional)" value={f.objectionText} onChange={(e) => set("objectionText", e.target.value)} maxLength={1000} />
                </section>
              )}

              <details className="rounded-sm border border-pfBorder p-3">
                <summary className="cursor-pointer text-sm text-pfSubtle">Weitere Angaben (optional)</summary>
                <div className="mt-3 grid gap-3">
                  <label className={labelClass}>Größtes Problem / Bedarf<input className={`${inputClass} mt-1`} value={f.painPoint} onChange={(e) => set("painPoint", e.target.value)} maxLength={1000} /></label>
                  <label className={labelClass}>Aktuelle Website-Situation<input className={`${inputClass} mt-1`} value={f.websiteSituation} onChange={(e) => set("websiteSituation", e.target.value)} maxLength={1000} /></label>
                  <label className={labelClass}>Budgetrahmen<input className={`${inputClass} mt-1`} value={f.budgetRange} onChange={(e) => set("budgetRange", e.target.value)} maxLength={120} /></label>
                </div>
              </details>
            </>
          )}

          <label className={labelClass}>
            Notizen
            <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={f.notes} onChange={(e) => set("notes", e.target.value)} maxLength={4000} />
          </label>
        </div>

        <footer className="space-y-2 border-t border-pfBorder p-4">
          {err && <p className="text-sm text-pfDanger" role="alert">{err}</p>}
          <button type="button" disabled={!canSave || busy} onClick={save} className="btn-accent w-full px-4 py-3 text-[0.7rem] disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? "Speichere …" : "Gespräch speichern"}
          </button>
          <p className="text-center text-[0.7rem] text-pfMuted">„Später“ schließt das Fenster, deine Eingaben bleiben erhalten, solange diese Seite offen ist. Fortsetzen bis {new Date(attempt.expiresAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })} Uhr über „Anrufen“.</p>
        </footer>
      </div>
    </div>
  ,
    document.body
  );
}

function AdminCalls({ view }: { view: AdminView }) {
  if (!view.batches.length) return <p className="text-pfSubtle">Heute hat noch kein Vertriebler seine Liste geöffnet.</p>;
  return (
    <div className="space-y-6">
      <p className="text-sm text-pfSubtle">Admin-Ansicht (nur lesen). Anrufe protokollieren nur Vertriebs-Konten.</p>
      {view.batches.map((b) => (
        <section key={b.id} className={cardClass}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg text-pfText">{b.owner.name || b.owner.email}</h2>
            <span className="text-xs text-pfSubtle" style={mono}>{b.state} · {b.entries.filter((e) => e.status !== "OPEN").length}/{b.actualCount} erledigt</span>
          </div>
          {b.note && <p className="mb-2 text-sm text-pfSubtle">{b.note}</p>}
          <ul className="space-y-1 text-sm">
            {b.entries.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 border-t border-pfBorder py-2">
                <span className="text-pfText">#{e.rank} {e.companyName} <span className="text-pfMuted">{e.city}</span></span>
                <span className="text-xs text-pfSubtle" style={mono}>{e.tier} · {e.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
