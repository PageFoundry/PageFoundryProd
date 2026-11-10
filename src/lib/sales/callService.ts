import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth";
import { normalizeEmail, normalizeHost } from "./leads";
import { formatPhoneDE } from "./phone";
import { isOutreachExcluded, loadOutreachExclusions } from "./outreachExclusions";
import { ATTEMPT_TTL_MS, CONFIRM_TEXT, planLogEffects, type CallLogInput, type TaskState } from "./callGuide";
import { createDemoRequestTx, notifyDemoRequested } from "./demoService";

// Schreibwege der Anrufliste. Jede Funktion:
//  - nur Rolle SALES (ADMIN schreibt hier nicht, er sieht nur)
//  - Owner/Lead/Entry/Task/Attempt serverseitig gebunden
//  - kurze Transaktion, Lead-Zeile per SELECT ... FOR UPDATE serialisiert
//  - Sperrliste (CallBlock) und abgeschlossene Leads dominieren

export class CallError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function requireSeller(actor: JwtPayload) {
  if (actor.role !== "SALES") throw new CallError(403, "SELLER_ONLY", "Nur Vertriebs-Konten protokollieren Anrufe.");
}

type Ident = { leadfinderId?: string | null; phoneNorm?: string | null; websiteHost?: string | null; emailNorm?: string | null };

function identOr(i: Ident) {
  const or: Array<Record<string, string>> = [];
  if (i.leadfinderId) or.push({ leadfinderId: i.leadfinderId });
  if (i.phoneNorm) or.push({ phoneNorm: i.phoneNorm });
  if (i.websiteHost) or.push({ websiteHost: i.websiteHost });
  if (i.emailNorm) or.push({ emailNorm: i.emailNorm });
  return or;
}

async function isBlocked(tx: Prisma.TransactionClient, i: Ident) {
  const or = identOr(i);
  if (!or.length) return false;
  return Boolean(await tx.callBlock.findFirst({ where: { OR: or }, select: { id: true } }));
}

/** Sperrquellen ausserhalb der DB (outreach-demo). Fehler -> keine Freigabe (fail-closed). */
function assertNotOutreachExcluded(i: { leadfinderId?: string | null; website?: string | null; email?: string | null }) {
  let ex;
  try {
    ex = loadOutreachExclusions();
  } catch (err) {
    console.error("[sales/call] outreach exclusions unreadable", err);
    throw new CallError(503, "SAFETY_SOURCE_DOWN", "Sperrliste aus outreach-demo nicht lesbar – Anruf gerade nicht freigegeben.");
  }
  if (isOutreachExcluded(ex, i)) throw new CallError(409, "OUTREACH_EXCLUDED", "Dieser Kontakt ist gesperrt (Werbewiderspruch/Bedenken aus dem E-Mail-Outreach).");
}

async function lockLead(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "SalesLead" WHERE id = ${id} FOR UPDATE`;
}

function attemptView(a: { id: string; phoneNorm: string; expiresAt: Date; salesLeadId: string; reasonText: string }) {
  return { attemptId: a.id, phone: a.phoneNorm, phoneDisplay: formatPhoneDE(a.phoneNorm), expiresAt: a.expiresAt.toISOString(), salesLeadId: a.salesLeadId, reasonText: a.reasonText };
}

/**
 * Checkbox "Anrufgrund passt, Unternehmen" -> Anrufversuch. Erst danach zeigt das UI den
 * tel:-Link. Pro Eintrag/Wiedervorlage gibt es hoechstens EINEN offenen Versuch; ein
 * paralleler zweiter Klick bekommt denselben Versuch zurueck.
 */
class RetryConfirm extends Error {}

export async function confirmCall(actor: JwtPayload, input: { entryId?: string; taskId?: string }, now = new Date()) {
  for (let i = 0; ; i++) {
    try {
      return await confirmCallOnce(actor, input, now);
    } catch (err) {
      if (err instanceof RetryConfirm && i < 2) continue;
      if (err instanceof RetryConfirm) throw new CallError(409, "BUSY", "Gerade parallel bearbeitet – bitte noch einmal klicken.");
      throw err;
    }
  }
}

async function confirmCallOnce(actor: JwtPayload, input: { entryId?: string; taskId?: string }, now: Date) {
  requireSeller(actor);
  if (Boolean(input.entryId) === Boolean(input.taskId)) throw new CallError(400, "BAD_INPUT", "Genau ein Eintrag oder eine Wiedervorlage.");

  if (input.entryId) {
    const pre = await prisma.callListEntry.findUnique({ where: { id: input.entryId }, include: { batch: { select: { ownerId: true, day: true } } } });
    if (!pre || pre.batch.ownerId !== actor.sub) throw new CallError(404, "NOT_FOUND", "Eintrag nicht gefunden.");
    assertNotOutreachExcluded({ leadfinderId: pre.leadfinderId, website: pre.website, email: pre.email });

    // Vorhandenen Lead (gleiche Firma/Nummer/Domain/E-Mail) VOR der Transaktion bestimmen, damit
    // sein Lock vor dem Eintrag geholt wird. Lock-Reihenfolge ueberall: Lead -> Eintrag -> Versuch.
    const preIdent: Ident = { leadfinderId: pre.leadfinderId, phoneNorm: pre.phoneNorm, websiteHost: normalizeHost(pre.website), emailNorm: normalizeEmail(pre.email) };
    const knownLeadId =
      pre.salesLeadId ?? (await prisma.salesLead.findFirst({ where: { OR: identOr(preIdent) }, select: { id: true } }))?.id ?? null;
    const res = await prisma.$transaction(async (tx): Promise<{ attempt: ReturnType<typeof attemptView> } | { deferred: CallError }> => {
      if (knownLeadId) await lockLead(tx, knownLeadId);
      await tx.$queryRaw`SELECT id FROM "CallListEntry" WHERE id = ${pre.id} FOR UPDATE`;
      const entry = await tx.callListEntry.findUniqueOrThrow({ where: { id: pre.id }, include: { batch: { select: { ownerId: true, day: true } } } });
      // Inzwischen von einem parallelen Klick verknuepft? Dann neu starten (sonst Lock-Zyklus).
      if (entry.salesLeadId !== pre.salesLeadId) throw new RetryConfirm();
      if (entry.batch.ownerId !== actor.sub) throw new CallError(404, "NOT_FOUND", "Eintrag nicht gefunden.");
      if (entry.status !== "OPEN") throw new CallError(409, "ENTRY_CLOSED", "Dieser Eintrag ist nicht mehr offen.");
      const claim = await tx.companyClaim.findUnique({ where: { key: `lf:${entry.leadfinderId}` } });
      if (!claim || claim.entryId !== entry.id || (claim.expiresAt && claim.expiresAt <= now)) throw new CallError(409, "CLAIM_EXPIRED", "Die Reservierung ist abgelaufen (neuer Tag).");

      const ident: Ident = { leadfinderId: entry.leadfinderId, phoneNorm: entry.phoneNorm, websiteHost: normalizeHost(entry.website), emailNorm: normalizeEmail(entry.email) };
      if (await isBlocked(tx, ident)) {
        // Markierung muss committen -> Fehler erst nach der Transaktion werfen.
        await tx.callListEntry.update({ where: { id: entry.id }, data: { status: "BLOCKED" } });
        return { deferred: new CallError(409, "BLOCKED", "Diese Nummer steht auf der Sperrliste.") };
      }

      // Lead anlegen bzw. verknuepfen – VOR dem Anruf, damit kein Doppelanruf entsteht.
      let leadId = entry.salesLeadId;
      if (!leadId) {
        const existing = await tx.salesLead.findFirst({ where: { OR: identOr(ident) }, select: { id: true, ownerId: true, status: true } });
        // Inzwischen entstanden und nicht vorab gesperrt -> neu starten (Lock-Reihenfolge).
        if (existing && existing.id !== knownLeadId) throw new RetryConfirm();
        if (existing) {
          if (existing.ownerId !== actor.sub || existing.status === "WON" || existing.status === "LOST") {
            await tx.callListEntry.update({ where: { id: entry.id }, data: { status: "BLOCKED" } });
            return { deferred: new CallError(409, "LEAD_TAKEN", "Dieser Kontakt ist bereits vergeben oder abgeschlossen.") };
          }
          leadId = existing.id;
        } else {
          const lead = await tx.salesLead.create({
            data: {
              ownerId: actor.sub,
              companyName: entry.companyName,
              phone: formatPhoneDE(entry.phoneNorm),
              phoneNorm: entry.phoneNorm,
              website: entry.website,
              websiteHost: ident.websiteHost,
              email: entry.email,
              emailNorm: ident.emailNorm,
              leadfinderId: entry.leadfinderId,
              notes: `Aus Anrufliste (${entry.tier}): ${entry.reasonText}`,
            },
            select: { id: true },
          });
          leadId = lead.id;
        }
        await tx.callListEntry.update({ where: { id: entry.id }, data: { salesLeadId: leadId } });
      }
      await lockLead(tx, leadId);
      const lead = await tx.salesLead.findUniqueOrThrow({ where: { id: leadId }, select: { status: true, ownerId: true, phoneNorm: true, websiteHost: true, emailNorm: true, leadfinderId: true } });
      // Abschluss/Fremdbesitz wird VOR jeder (Wieder-)Freigabe geprueft, auch fuer offene Versuche.
      if (lead.ownerId !== actor.sub || lead.status === "WON" || lead.status === "LOST") {
        await tx.callListEntry.update({ where: { id: entry.id }, data: { status: "BLOCKED" } });
        return { deferred: new CallError(409, "LEAD_TAKEN", "Dieser Kontakt ist bereits vergeben oder abgeschlossen.") };
      }
      // Eine Nummer: gewaehlt wird die aktuelle Lead-Nummer (nach einer Korrektur nie die alte aus der Liste).
      // Nummer am Lead geloescht/ungueltig -> nicht auf die alte Listennummer zurueckfallen.
      if (!lead.phoneNorm) return { deferred: new CallError(409, "NO_PHONE", "Am Lead steht keine gültige Telefonnummer. Bitte unter „Meine Leads“ korrigieren.") };
      const callPhone = lead.phoneNorm;
      if (callPhone !== entry.phoneNorm && (await isBlocked(tx, { ...lead, phoneNorm: callPhone }))) {
        await tx.callListEntry.update({ where: { id: entry.id }, data: { status: "BLOCKED" } });
        return { deferred: new CallError(409, "BLOCKED", "Diese Nummer steht auf der Sperrliste.") };
      }
      const open = await tx.callAttempt.findFirst({ where: { entryId: entry.id, log: null, expiresAt: { gt: now }, phoneNorm: callPhone } });
      if (open) return { attempt: attemptView(open) };

      const attempt = await tx.callAttempt.create({
        data: {
          ownerId: actor.sub,
          salesLeadId: leadId,
          entryId: entry.id,
          phoneNorm: callPhone,
          reasonText: entry.reasonText,
          confirmedText: CONFIRM_TEXT,
          confirmedAt: now,
          expiresAt: new Date(now.getTime() + ATTEMPT_TTL_MS),
        },
      });
      return { attempt: attemptView(attempt) };
    }).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new CallError(409, "LEAD_TAKEN", "Dieser Kontakt wurde gerade von jemand anderem übernommen.");
      }
      throw err;
    });
    if ("deferred" in res && res.deferred) throw res.deferred;
    return (res as { attempt: ReturnType<typeof attemptView> }).attempt;
  }

  // Wiedervorlage
  const preTask = await prisma.callTask.findUnique({ where: { id: input.taskId! }, include: { salesLead: true } });
  if (!preTask || preTask.ownerId !== actor.sub) throw new CallError(404, "NOT_FOUND", "Wiedervorlage nicht gefunden.");
  assertNotOutreachExcluded({ leadfinderId: preTask.salesLead.leadfinderId, website: preTask.salesLead.website, email: preTask.salesLead.email });

  const res = await prisma.$transaction(async (tx): Promise<{ attempt: ReturnType<typeof attemptView> } | { deferred: CallError }> => {
    await lockLead(tx, preTask.salesLeadId);
    const task = await tx.callTask.findUniqueOrThrow({ where: { id: preTask.id } });
    const lead = await tx.salesLead.findUniqueOrThrow({ where: { id: task.salesLeadId } });
    if (task.ownerId !== actor.sub || lead.ownerId !== actor.sub) throw new CallError(404, "NOT_FOUND", "Wiedervorlage nicht gefunden.");
    if (task.state !== "OPEN") throw new CallError(409, "TASK_CLOSED", "Diese Wiedervorlage ist erledigt.");
    if (task.nextAttemptAt.getTime() > now.getTime() + 15 * 60_000) throw new CallError(409, "TASK_NOT_DUE", "Diese Wiedervorlage ist noch nicht fällig.");
    if (lead.status === "WON" || lead.status === "LOST") throw new CallError(409, "LEAD_CLOSED", "Lead ist abgeschlossen.");
    if (!lead.phoneNorm) throw new CallError(409, "NO_PHONE", "Keine gültige Telefonnummer am Lead.");
    if (await isBlocked(tx, lead)) {
      await tx.callTask.update({ where: { id: task.id }, data: { state: "CANCELLED" } });
      return { deferred: new CallError(409, "BLOCKED", "Diese Nummer steht auf der Sperrliste.") };
    }
    const open = await tx.callAttempt.findFirst({ where: { taskId: task.id, log: null, expiresAt: { gt: now }, phoneNorm: lead.phoneNorm } });
    if (open) return { attempt: attemptView(open) };
    const attempt = await tx.callAttempt.create({
      data: {
        ownerId: actor.sub,
        salesLeadId: lead.id,
        taskId: task.id,
        phoneNorm: lead.phoneNorm,
        reasonText: task.kind === "CALLBACK" ? "Vereinbarter Rückruf" : `Erneuter Versuch (${task.failedAttempts + 1}. Anlauf)`,
        confirmedText: CONFIRM_TEXT,
        confirmedAt: now,
        expiresAt: new Date(now.getTime() + ATTEMPT_TTL_MS),
      },
    });
    return { attempt: attemptView(attempt) };
  });
  if ("deferred" in res) throw res.deferred;
  return res.attempt;
}

/** Protokoll zu einem Anrufversuch. Gleicher Versuch zweimal -> erstes Protokoll zurueck. */
export async function logCall(actor: JwtPayload, input: CallLogInput, now = new Date()) {
  requireSeller(actor);
  const result = await logCallTx(actor, input, now);
  if (result.demoRequestId && result.demoCreated) await notifyDemoRequested(result.demoRequestId);
  return result;
}

async function logCallTx(actor: JwtPayload, input: CallLogInput, now: Date): Promise<{ logId: string; duplicate: boolean; demoRequestId?: string; demoCreated?: boolean }> {
  // Lock-Reihenfolge ueberall: Lead -> Attempt (wie im Lead-PATCH), sonst Deadlock.
  const peek = await prisma.callAttempt.findUnique({ where: { id: input.attemptId }, select: { ownerId: true, salesLeadId: true } });
  if (!peek || peek.ownerId !== actor.sub) throw new CallError(404, "NOT_FOUND", "Anrufversuch nicht gefunden.");
  return prisma.$transaction(async (tx) => {
    await lockLead(tx, peek.salesLeadId);
    await tx.$queryRaw`SELECT id FROM "CallAttempt" WHERE id = ${input.attemptId} FOR UPDATE`;
    const attempt = await tx.callAttempt.findUnique({ where: { id: input.attemptId }, include: { log: { select: { id: true } } } });
    if (!attempt || attempt.ownerId !== actor.sub || attempt.salesLeadId !== peek.salesLeadId) throw new CallError(404, "NOT_FOUND", "Anrufversuch nicht gefunden.");
    if (attempt.log) return { logId: attempt.log.id, duplicate: true };
    if (attempt.expiresAt <= now) throw new CallError(410, "ATTEMPT_EXPIRED", "Der Anrufversuch ist abgelaufen. Bitte neu bestätigen und protokollieren.");

    const lead = await tx.salesLead.findUniqueOrThrow({ where: { id: attempt.salesLeadId } });
    if (lead.ownerId !== actor.sub) throw new CallError(404, "NOT_FOUND", "Anrufversuch nicht gefunden.");
    const task = await tx.callTask.findUnique({ where: { salesLeadId: lead.id } });
    const blocked = (await isBlocked(tx, lead)) || (await isBlocked(tx, { phoneNorm: attempt.phoneNorm }));
    const taskState: TaskState = task ? { state: task.state, kind: task.kind, failedAttempts: task.failedAttempts } : null;
    const fx = planLogEffects(input, { leadStatus: lead.status, task: taskState, blocked }, now);

    const log = await tx.callLog.create({
      data: {
        attemptId: attempt.id,
        ownerId: actor.sub,
        salesLeadId: lead.id,
        reached: input.reached,
        contactName: input.contactName,
        contactRole: input.contactRole,
        isDecisionMaker: input.isDecisionMaker,
        outcome: input.outcome,
        callbackAt: input.callbackAt,
        demoAt: input.demoAt,
        painPoint: input.painPoint,
        websiteSituation: input.websiteSituation,
        budgetRange: input.budgetRange,
        objection: input.objection,
        objectionText: input.objectionText,
        notes: input.notes,
        newWebsite: input.newWebsite,
      },
      select: { id: true },
    });

    // Lead: Status nur aufwaerts (Bedingung auf alten Status), Kontaktperson uebernehmen.
    const leadClosed = lead.status === "WON" || lead.status === "LOST";
    const leadData: Prisma.SalesLeadUpdateManyMutationInput = {};
    if (fx.leadStatus) leadData.status = fx.leadStatus;
    // Abgeschlossene Leads: nur Historie (Log) und Sperre, keine Stammdatenaenderung.
    if (!leadClosed && input.contactName && !lead.contactName) leadData.contactName = input.contactName;
    if (Object.keys(leadData).length) {
      await tx.salesLead.updateMany({ where: { id: lead.id, status: lead.status }, data: leadData });
    }
    if (!leadClosed && fx.newWebsiteHost && fx.newWebsiteHost !== lead.websiteHost) {
      const clash = await tx.salesLead.findFirst({ where: { websiteHost: fx.newWebsiteHost, NOT: { id: lead.id } }, select: { id: true } });
      if (!clash) await tx.salesLead.update({ where: { id: lead.id }, data: { website: input.newWebsite, websiteHost: fx.newWebsiteHost } });
    }

    // Wiedervorlage
    if (fx.task.action === "upsert") {
      await tx.callTask.upsert({
        where: { salesLeadId: lead.id },
        create: { salesLeadId: lead.id, ownerId: actor.sub, kind: fx.task.kind, nextAttemptAt: fx.task.nextAttemptAt, failedAttempts: fx.task.failedAttempts, state: "OPEN" },
        update: { kind: fx.task.kind, nextAttemptAt: fx.task.nextAttemptAt, failedAttempts: fx.task.failedAttempts, state: "OPEN" },
      });
    } else if (fx.task.action === "close") {
      if (task) await tx.callTask.update({ where: { id: task.id }, data: { state: fx.task.state, ...(fx.task.failedAttempts != null ? { failedAttempts: fx.task.failedAttempts } : {}) } });
      else if (fx.task.state === "DONE" && fx.task.failedAttempts != null) {
        await tx.callTask.create({ data: { salesLeadId: lead.id, ownerId: actor.sub, kind: "RETRY", nextAttemptAt: now, failedAttempts: fx.task.failedAttempts, state: "DONE" } });
      }
    }

    // Werbewiderspruch: zentrale Sperre (gilt auch fuer E-Mail-Outreach).
    if (fx.block) {
      // Gesperrt wird die tatsaechlich gewaehlte Nummer.
      const phoneNorm = attempt.phoneNorm;
      await tx.callBlock.upsert({
        where: { phoneNorm },
        create: { phoneNorm, websiteHost: lead.websiteHost, emailNorm: lead.emailNorm, leadfinderId: lead.leadfinderId, companyName: lead.companyName, reason: "Werbewiderspruch am Telefon", createdById: actor.sub },
        update: {},
      });
      await tx.callListEntry.updateMany({ where: { phoneNorm, status: "OPEN" }, data: { status: "BLOCKED" } });
    }

    // Demo vereinbart -> Anfrage an Fabian (nicht bei gesperrtem oder abgeschlossenem Lead).
    let demo: { id: string; created: boolean } | undefined;
    if (input.outcome === "DEMO_BOOKED" && !fx.block && !blocked && lead.status !== "WON" && lead.status !== "LOST" && input.demoEmail && input.demoBriefing) {
      const emailNorm = normalizeEmail(input.demoEmail);
      if (!lead.email && emailNorm) {
        const clash = await tx.salesLead.findFirst({ where: { emailNorm, NOT: { id: lead.id } }, select: { id: true } });
        if (!clash) await tx.salesLead.update({ where: { id: lead.id }, data: { email: input.demoEmail, emailNorm } });
      }
      demo = await createDemoRequestTx(tx, {
        salesLeadId: lead.id,
        requestedById: actor.sub,
        customerEmail: input.demoEmail,
        briefing: input.demoBriefing,
        packageInterest: input.packageInterest,
        meetingAt: input.demoAt,
      });
    }

    if (attempt.entryId) await tx.callListEntry.updateMany({ where: { id: attempt.entryId, status: "OPEN" }, data: { status: "DONE" } });
    return { logId: log.id, duplicate: false, demoRequestId: demo?.id, demoCreated: demo?.created };
  });
}
