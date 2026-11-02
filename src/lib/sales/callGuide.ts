import { z } from "zod";
import type { SalesLeadStatus } from "@prisma/client";
import { normalizeHost } from "./leads";
import type { Branch, Tier } from "./ranking";

// Reine Regeln fuer Anrufliste und Gespraechsprotokoll (ohne DB, unit-testbar).

// ── Zeit: Berliner Kalendertag ──────────────────────────────────────────────

const berlinFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function berlinParts(t: number) {
  const p = Object.fromEntries(berlinFmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
}

/** "YYYY-MM-DD" in Europe/Berlin. */
export function berlinDay(now: Date = new Date()): string {
  return berlinParts(now.getTime()).day;
}

/** Wert fuer eine Prisma-Spalte @db.Date (Mitternacht UTC des Kalendertags). */
export function dayToDbDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** UTC-Zeitpunkt fuer "day hour:00" Berliner Zeit (beruecksichtigt Sommerzeit). */
export function berlinLocalToUtc(day: string, hour: number): Date {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour);
  for (const offH of [1, 2, 0, 3]) {
    const t = guess - offH * 3_600_000;
    const p = berlinParts(t);
    if (p.day === day && p.hour === hour && p.minute === 0) return new Date(t);
  }
  return new Date(guess - 3_600_000);
}

/** Ende des Berliner Tages (= 00:00 des Folgetags) als UTC-Zeitpunkt. */
export function endOfBerlinDay(day: string): Date {
  return berlinLocalToUtc(addDays(day, 1), 0);
}

/** Naechster Werktag 09:00 Berliner Zeit (fuer Wiedervorlage nach Nichterreichen). */
export function nextWorkdayMorning(now: Date): Date {
  let day = addDays(berlinDay(now), 1);
  for (;;) {
    const wd = new Date(`${day}T12:00:00.000Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) break;
    day = addDays(day, 1);
  }
  return berlinLocalToUtc(day, 9);
}

// ── Konstanten ──────────────────────────────────────────────────────────────

export const CALLS_PER_DAY = 30; // Fabian 2026-11-01 (vorher 10)
export const MAX_PER_PLZ_PREFIX = 3;
export const MAX_FAILED_ATTEMPTS = 3;
export const ATTEMPT_TTL_MS = 2 * 60 * 60 * 1000;
export const CONFIRM_TEXT = "Anrufgrund geprüft und passend; Gegenüber ist ein Unternehmen (keine Privatperson).";

/** Reservierungsschluessel einer Firma (globale Doppelvergabe-Sperre). */
export function claimKeys(c: { leadfinderId: string; phoneNorm: string; website?: string | null; emailNorm?: string | null }): string[] {
  const keys = [`lf:${c.leadfinderId}`, `ph:${c.phoneNorm}`];
  const host = normalizeHost(c.website);
  if (host) keys.push(`host:${host}`);
  if (c.emailNorm) keys.push(`mail:${c.emailNorm}`);
  return keys;
}

// ── Protokoll-Schema ────────────────────────────────────────────────────────

export const REACHED = ["NOT_REACHED", "VOICEMAIL", "WRONG_NUMBER", "REACHED"] as const;
export const OUTCOMES = ["NO_INTEREST", "CALLBACK", "DEMO_BOOKED", "OFFER_REQUESTED", "DO_NOT_CALL", "HAS_NEW_WEBSITE"] as const;
export const OBJECTIONS = ["PRICE", "NO_TIME", "HAS_PROVIDER", "NO_NEED", "OTHER"] as const;
export const PACKAGE_INTEREST = ["sichtbar", "gefunden", "gebucht", "unklar"] as const;

const text = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const isoDate = z.string().datetime({ offset: true }).transform((v) => new Date(v));

export function callLogSchema(now: Date = new Date()) {
  return z
    .object({
      attemptId: z.string().min(1).max(40),
      reached: z.enum(REACHED),
      contactName: text(200),
      contactRole: text(120),
      isDecisionMaker: z.boolean().optional(),
      outcome: z.enum(OUTCOMES).optional(),
      callbackAt: isoDate.optional(),
      demoAt: isoDate.optional(),
      painPoint: text(1000),
      websiteSituation: text(1000),
      budgetRange: text(120),
      objection: z.enum(OBJECTIONS).optional(),
      objectionText: text(1000),
      notes: text(4000),
      newWebsite: text(512),
      // Nur bei DEMO_BOOKED: Grundlage fuer Fabians Demo-Seite
      demoEmail: z.union([z.literal(""), z.string().trim().email().max(320)]).optional().transform((v) => (v ? v : undefined)),
      demoBriefing: text(4000),
      packageInterest: z.enum(PACKAGE_INTEREST).optional(),
    })
    .superRefine((v, ctx) => {
      if (v.reached === "REACHED" && !v.outcome) {
        ctx.addIssue({ code: "custom", path: ["outcome"], message: "Ergebnis des Gesprächs fehlt" });
      }
      if (v.reached !== "REACHED" && v.outcome) {
        ctx.addIssue({ code: "custom", path: ["outcome"], message: "Ergebnis nur bei erreichtem Gesprächspartner" });
      }
      if (v.outcome === "CALLBACK") {
        if (!v.callbackAt) ctx.addIssue({ code: "custom", path: ["callbackAt"], message: "Rückruf-Zeitpunkt fehlt" });
        else if (v.callbackAt.getTime() <= now.getTime() || v.callbackAt.getTime() > now.getTime() + 120 * 86_400_000) {
          ctx.addIssue({ code: "custom", path: ["callbackAt"], message: "Rückruf muss in der Zukunft liegen (max. 120 Tage)" });
        }
      }
      if (v.outcome === "DEMO_BOOKED") {
        if (!v.demoEmail) ctx.addIssue({ code: "custom", path: ["demoEmail"], message: "E-Mail für den Demo-Link fehlt" });
        if (!v.demoBriefing || v.demoBriefing.length < 20) {
          ctx.addIssue({ code: "custom", path: ["demoBriefing"], message: "Kurzbriefing für die Demo fehlt (mind. 20 Zeichen)" });
        }
      }
      if (v.outcome === "HAS_NEW_WEBSITE" && !normalizeHost(v.newWebsite)) {
        ctx.addIssue({ code: "custom", path: ["newWebsite"], message: "Neue Website (Domain) fehlt oder ist ungültig" });
      }
    });
}

export type CallLogInput = z.infer<ReturnType<typeof callLogSchema>>;

// ── Zustandsuebergaenge ─────────────────────────────────────────────────────

const STATUS_RANK: Record<string, number> = { NEW: 0, CONTACTED: 1, MEETING: 2, OFFER: 3 };

export type TaskState = { state: "OPEN" | "DONE" | "CANCELLED"; kind: "CALLBACK" | "RETRY"; failedAttempts: number } | null;

export type TaskEffect =
  | { action: "none" }
  | { action: "upsert"; kind: "CALLBACK" | "RETRY"; nextAttemptAt: Date; failedAttempts: number }
  | { action: "close"; state: "DONE" | "CANCELLED"; failedAttempts?: number };

export type LogEffects = { leadStatus: SalesLeadStatus | null; task: TaskEffect; block: boolean; newWebsiteHost: string | null };

/**
 * Folgen eines Protokolls. Regeln:
 *  - Lead-Status steigt nur (NEW < CONTACTED < MEETING < OFFER), nie aus WON/LOST heraus.
 *  - DO_NOT_CALL sperrt immer (auch bei abgeschlossenem Lead) und beendet die Wiedervorlage.
 *  - Eine abgebrochene Wiedervorlage (CANCELLED) wird nie wieder geoeffnet.
 *  - Nicht erreicht/Mailbox: Wiedervorlage am naechsten Werktag, nach 3 Fehlversuchen Schluss.
 */
export function planLogEffects(
  input: { reached: CallLogInput["reached"]; outcome?: CallLogInput["outcome"]; callbackAt?: Date; newWebsite?: string },
  current: { leadStatus: SalesLeadStatus; task: TaskState; blocked: boolean },
  now: Date
): LogEffects {
  const closed = current.leadStatus === "WON" || current.leadStatus === "LOST";
  const block = input.outcome === "DO_NOT_CALL";

  let target: SalesLeadStatus = "CONTACTED";
  if (input.outcome === "DEMO_BOOKED") target = "MEETING";
  if (input.outcome === "OFFER_REQUESTED") target = "OFFER";
  const leadStatus = !closed && STATUS_RANK[target] > (STATUS_RANK[current.leadStatus] ?? 99) ? target : null;

  const newWebsiteHost = input.outcome === "HAS_NEW_WEBSITE" ? normalizeHost(input.newWebsite) : null;

  let task: TaskEffect;
  if (block || current.blocked) task = { action: "close", state: "CANCELLED" };
  else if (closed || current.task?.state === "CANCELLED") task = current.task?.state === "OPEN" ? { action: "close", state: "CANCELLED" } : { action: "none" };
  else if (input.reached === "WRONG_NUMBER" || input.outcome === "HAS_NEW_WEBSITE") task = { action: "close", state: "CANCELLED" };
  else if (input.outcome === "CALLBACK" && input.callbackAt) task = { action: "upsert", kind: "CALLBACK", nextAttemptAt: input.callbackAt, failedAttempts: 0 };
  else if (input.reached === "NOT_REACHED" || input.reached === "VOICEMAIL") {
    const failed = (current.task?.failedAttempts ?? 0) + 1;
    task = failed >= MAX_FAILED_ATTEMPTS
      ? { action: "close", state: "DONE", failedAttempts: failed }
      : { action: "upsert", kind: "RETRY", nextAttemptAt: nextWorkdayMorning(now), failedAttempts: failed };
  } else task = current.task ? { action: "close", state: "DONE" } : { action: "none" };

  return { leadStatus, task, block, newWebsiteHost };
}

// ── Leitfaden ───────────────────────────────────────────────────────────────

export const GUIDE = {
  intro: (tier: Tier, company: string, rep: string) =>
    ({
      A: `Guten Tag, hier ist ${rep} von PageFoundry. Ich rufe an, weil uns aufgefallen ist, dass die Website von ${company} gerade nicht erreichbar ist. Wussten Sie das schon, oder haben Sie inzwischen eine neue Seite?`,
      B: `Guten Tag, hier ist ${rep} von PageFoundry. Wir bauen Websites für Betriebe in NRW. Bei Ihrer Seite sind uns ein paar konkrete Punkte aufgefallen. Darf ich Ihnen kurz sagen, welche?`,
      C: `Guten Tag, hier ist ${rep} von PageFoundry. Wir bauen Websites für Betriebe in NRW. Ich habe online keine Website von ${company} gefunden. Ist das bewusst so, oder gibt es eine, die ich übersehen habe?`,
    })[tier],
  questions: [
    "Wie finden neue Kunden Sie heute hauptsächlich?",
    "Wer kümmert sich bei Ihnen um die Website bzw. den Online-Auftritt?",
    "Was wäre Ihnen an einer Website am wichtigsten (Anfragen, Termine, Vertrauen, Stellenanzeigen)?",
    "Darf ich Ihnen eine kostenlose Demo-Seite für Ihren Betrieb zeigen? Das dauert 15 Minuten.",
  ],
  objections: {
    PRICE: "Verstehe. Die Demo ist kostenlos und unverbindlich, danach sehen Sie die Festpreise und entscheiden in Ruhe.",
    NO_TIME: "Kein Problem. Wann passt es Ihnen besser? Dann rufe ich zu dem Zeitpunkt noch einmal an.",
    HAS_PROVIDER: "Gut, dass Sie versorgt sind. Darf ich fragen, ob Sie mit den Anfragen über die Seite zufrieden sind?",
    NO_NEED: "Danke für die offene Antwort. Darf ich mich in ein paar Monaten noch einmal melden, oder lieber gar nicht mehr?",
    OTHER: "Danke, das notiere ich mir.",
  } as Record<(typeof OBJECTIONS)[number], string>,
  doNotCall: "Wenn das Gegenüber keine Anrufe mehr möchte: sofort zusagen, „Nicht mehr anrufen“ wählen. Das sperrt Telefon UND E-Mail-Werbung.",
} as const;

const DEMO_BY_BRANCH: Partial<Record<Branch, string>> = {
  gastro: "https://demo.pagefoundry.de/theloft/",
  handwerk: "https://demo.pagefoundry.de/servicewerk/",
  bestattung: "https://demo.pagefoundry.de/bestattungen-schneider-wermelskirchen/",
  verein: "https://demo.pagefoundry.de/islandtafel/",
};

export function demoForBranch(branch: Branch | null): string {
  return (branch && DEMO_BY_BRANCH[branch]) || "https://demo.pagefoundry.de/salis/";
}

export function websiteSearchUrl(company: string, city: string | null, plz: string | null): string {
  const q = [company, city || plz].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
