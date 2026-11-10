import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizeHost } from "./leads";
import { fetchLeadfinderCandidates } from "./leadfinder";
import { isOutreachExcluded, loadOutreachExclusions, type OutreachExclusions } from "./outreachExclusions";
import { capPerPlzPrefix, compareRanked, prefilter, sortPrefiltered, type LfCandidate, type Prefiltered, type Ranked } from "./ranking";
import { checkSite, reasonFromFindings, type SiteFindings } from "./siteCheck";
import { berlinDay, CALLS_PER_DAY, claimKeys, dayToDbDate, endOfBerlinDay, MAX_PER_PLZ_PREFIX } from "./callGuide";

// Tagesliste der Anrufe. Ablauf (siehe Vault projects/pagefoundry-sales-portal.md):
//  1. GET legt den Batch (owner, Berliner Tag) an oder uebernimmt einen verwaisten
//     (Lease abgelaufen / FAILED) mit neuem genToken und startet die Erzeugung im
//     Hintergrund. Der Client pollt.
//  2. Erzeugung ausserhalb jeder DB-Transaktion: Kandidaten, Ausschluesse, Live-Checks.
//     Heartbeat verlaengert die Lease, solange der Token noch gilt.
//  3. Finalisierung in EINER Transaktion: bedingtes Batch-Update (genToken = meins) zuerst,
//     dann Claims + Entries. Passt der Token nicht mehr, wird alles zurueckgerollt.

export const GEN = {
  leaseMs: 3 * 60_000,
  heartbeatMs: 30_000,
  wallMs: 4 * 60_000,
  maxSiteChecks: 90,
  concurrency: 6,
  poolPerTier: { A: 400, B: 600, C: 400 } as const,
};

// ── Abhaengigkeiten (in Tests ersetzbar) ────────────────────────────────────

export type GenDeps = {
  fetchCandidates: (opts: { excludeIds: string[]; day: string; limit: number; tier: "A" | "B" | "C" }) => Promise<LfCandidate[]>;
  loadExclusions: () => OutreachExclusions;
  checkSite: (website: string) => Promise<SiteFindings>;
  now: () => Date;
};

function testDbActive() {
  try {
    return new URL(process.env.DATABASE_URL || "").pathname === "/pagefoundry_test";
  } catch {
    return false;
  }
}

/** Fixture-Check NUR gegen die Test-DB: kein echter Netzverkehr in Tests. */
async function fixtureCheckSite(website: string): Promise<SiteFindings> {
  const host = website.replace(/^https?:\/\//, "").split("/")[0];
  const base = { host, checkedAt: new Date().toISOString(), hops: [host], flags: {} };
  if (host.includes("dead")) return { ...base, verdict: "DEAD", deadReason: "dns" };
  if (host.includes("weak")) return { ...base, verdict: "WEAK", flags: { noViewport: true } };
  if (host.includes("unknown")) return { ...base, verdict: "UNKNOWN", unknownReason: "timeout" };
  return { ...base, verdict: "OK" };
}

export const defaultDeps: GenDeps = {
  fetchCandidates: fetchLeadfinderCandidates,
  loadExclusions: () => loadOutreachExclusions(),
  checkSite: (w) => (process.env.SALES_SITECHECK_MODE === "fixture" && testDbActive() ? fixtureCheckSite(w) : checkSite(w)),
  now: () => new Date(),
};

// ── Batch holen / starten ───────────────────────────────────────────────────

const running = new Set<string>(); // Batch-IDs, die dieser Prozess gerade erzeugt

export function retainedBatchWhere(dbDay: Date): Prisma.CallListBatchWhereInput {
  return { keepUntilDone: true, day: { lt: dbDay }, state: "READY", entries: { some: { status: "OPEN" } } };
}

export async function getOrStartBatch(ownerId: string, deps: GenDeps = defaultDeps) {
  const now = deps.now();
  const day = berlinDay(now);
  const dbDay = dayToDbDate(day);

  const retained = await prisma.callListBatch.findFirst({
    where: { ownerId, ...retainedBatchWhere(dbDay) },
    orderBy: { day: "asc" },
  });
  if (retained) return retained;

  // Nicht angerufene Eintraege frueherer Tage verfallen (Claims laufen am Tagesende ab).
  await prisma.callListEntry.updateMany({
    where: { status: "OPEN", batch: { ownerId, day: { lt: dbDay }, keepUntilDone: false } },
    data: { status: "EXPIRED" },
  });

  let batch = await prisma.callListBatch.findUnique({ where: { ownerId_day: { ownerId, day: dbDay } } });
  if (!batch) {
    const token = randomUUID();
    try {
      batch = await prisma.callListBatch.create({
        data: { ownerId, day: dbDay, state: "GENERATING", genToken: token, leaseUntil: new Date(now.getTime() + GEN.leaseMs), targetCount: CALLS_PER_DAY },
      });
      startGeneration(batch.id, token, ownerId, day, deps);
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
      batch = await prisma.callListBatch.findUniqueOrThrow({ where: { ownerId_day: { ownerId, day: dbDay } } });
    }
  } else if (batch.state === "FAILED" || (batch.state === "GENERATING" && (!batch.leaseUntil || batch.leaseUntil < now))) {
    // Verwaister oder fehlgeschlagener Batch: atomar uebernehmen.
    const token = randomUUID();
    const taken = await prisma.callListBatch.updateMany({
      where: {
        id: batch.id,
        OR: [{ state: "FAILED" }, { state: "GENERATING", OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] }],
      },
      data: { state: "GENERATING", genToken: token, leaseUntil: new Date(now.getTime() + GEN.leaseMs), note: null },
    });
    if (taken.count === 1) startGeneration(batch.id, token, ownerId, day, deps);
    batch = await prisma.callListBatch.findUniqueOrThrow({ where: { id: batch.id } });
  }
  return batch;
}

function startGeneration(batchId: string, token: string, ownerId: string, day: string, deps: GenDeps) {
  if (running.has(batchId)) return;
  running.add(batchId);
  void generate(batchId, token, ownerId, day, deps)
    .catch(async (err) => {
      console.error("[sales/callList] generation failed", batchId, err);
      await prisma.callListBatch
        .updateMany({
          where: { id: batchId, genToken: token, state: "GENERATING" },
          data: { state: "FAILED", genToken: null, leaseUntil: null, note: String(err?.publicMessage || "Liste konnte nicht erstellt werden").slice(0, 500), finishedAt: new Date() },
        })
        .catch(() => {});
    })
    .finally(() => running.delete(batchId));
}

class PublicError extends Error {
  constructor(public publicMessage: string) {
    super(publicMessage);
  }
}

// ── Erzeugung ───────────────────────────────────────────────────────────────

type Identity = { lf: Set<string>; phones: Set<string>; hosts: Set<string>; emails: Set<string> };

async function loadIdentities(now: Date): Promise<Identity> {
  const [leads, blocks, claims] = await Promise.all([
    prisma.salesLead.findMany({ select: { leadfinderId: true, phoneNorm: true, websiteHost: true, emailNorm: true } }),
    prisma.callBlock.findMany({ select: { leadfinderId: true, phoneNorm: true, websiteHost: true, emailNorm: true } }),
    prisma.companyClaim.findMany({ where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, select: { key: true } }),
  ]);
  const id: Identity = { lf: new Set(), phones: new Set(), hosts: new Set(), emails: new Set() };
  for (const r of [...leads, ...blocks]) {
    if (r.leadfinderId) id.lf.add(r.leadfinderId);
    if (r.phoneNorm) id.phones.add(r.phoneNorm);
    if (r.websiteHost) id.hosts.add(r.websiteHost);
    if (r.emailNorm) id.emails.add(r.emailNorm);
  }
  for (const { key } of claims) {
    const [kind, ...rest] = key.split(":");
    const v = rest.join(":");
    if (kind === "lf") id.lf.add(v);
    else if (kind === "ph") id.phones.add(v);
    else if (kind === "host") id.hosts.add(v);
    else if (kind === "mail") id.emails.add(v);
  }
  return id;
}

function takenBy(id: Identity, p: Prefiltered): boolean {
  const host = normalizeHost(p.c.website);
  const email = normalizeEmail(p.c.email);
  return id.lf.has(p.c.id) || id.phones.has(p.phoneNorm) || Boolean(host && id.hosts.has(host)) || Boolean(email && id.emails.has(email));
}

type Picked = Ranked & { reasonText: string; findings: SiteFindings | null };

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

export async function generate(batchId: string, token: string, ownerId: string, day: string, deps: GenDeps) {
  const batch = await prisma.callListBatch.findFirst({
    where: { id: batchId, ownerId, genToken: token, state: "GENERATING" },
    select: { targetCount: true },
  });
  if (!batch) return;
  const targetCount = batch.targetCount;
  if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > CALLS_PER_DAY) throw new PublicError("Ungültige Anzahl für die Anrufliste.");
  const started = deps.now().getTime();
  let lost = false;
  const heartbeat = setInterval(async () => {
    const r = await prisma.callListBatch
      .updateMany({ where: { id: batchId, genToken: token, state: "GENERATING" }, data: { leaseUntil: new Date(Date.now() + GEN.leaseMs) } })
      .catch(() => ({ count: 0 }));
    if (r.count !== 1) lost = true;
  }, GEN.heartbeatMs);
  heartbeat.unref?.();

  try {
    // Sicherheitsquellen zuerst: ohne lesbare outreach-demo-DB keine Liste (fail-closed).
    let outreach: OutreachExclusions;
    try {
      outreach = deps.loadExclusions();
    } catch (err) {
      console.error("[sales/callList] outreach exclusions unreadable", err);
      throw new PublicError("Sperrliste aus outreach-demo nicht lesbar – keine Liste erstellt. Bitte Admin informieren.");
    }
    const ident = await loadIdentities(deps.now());
    const excludeIds = [...new Set([...ident.lf, ...outreach.leadfinderIds])];

    const pre: Prefiltered[] = [];
    for (const tier of ["A", "B", "C"] as const) {
      const rows = await deps.fetchCandidates({ excludeIds, day, limit: GEN.poolPerTier[tier], tier });
      for (const c of rows) {
        const f = prefilter(c);
        if (!f.ok) continue;
        if (takenBy(ident, f.v)) continue;
        if (isOutreachExcluded(outreach, { leadfinderId: c.id, website: c.website, email: c.email })) continue;
        pre.push(f.v);
      }
    }
    const sorted = sortPrefiltered(pre, day);

    // Live-Checks fuer A/B in Reihenfolge, bis genug bestaetigt sind oder Budget aus.
    const checkQueue = sorted.filter((p) => p.preTier !== "C" && p.c.website && !p.platform);
    const verified: Picked[] = [];
    let checks = 0;
    for (let off = 0; off < checkQueue.length && verified.length < targetCount && checks < GEN.maxSiteChecks; ) {
      if (lost) throw new PublicError("Erzeugung wurde von einem anderen Prozess übernommen.");
      if (deps.now().getTime() - started > GEN.wallMs) break;
      const n = Math.min(GEN.concurrency * 2, GEN.maxSiteChecks - checks, checkQueue.length - off);
      const slice = checkQueue.slice(off, off + n);
      off += n;
      checks += n;
      // Ein einzelner Fehler (z. B. kaputter Redirect) darf nie den ganzen Lauf kippen.
      const results = await mapLimit(slice, GEN.concurrency, async (p) => ({
        p,
        f: await deps.checkSite(p.c.website!).catch(
          (): SiteFindings => ({ verdict: "UNKNOWN", host: p.c.website!, checkedAt: new Date().toISOString(), flags: {}, hops: [], unknownReason: "check_error" })
        ),
      }));
      for (const { p, f } of results) {
        const reason = reasonFromFindings(f);
        if (!reason) continue;
        verified.push({ ...p, tier: f.verdict === "DEAD" ? "A" : "B", reasonText: reason, findings: f });
      }
    }
    const cRows: Picked[] = sorted
      .filter((p) => p.preTier === "C")
      .map((p) => ({
        ...p,
        tier: "C",
        findings: null,
        reasonText: p.platform
          ? `Im Datenbestand ist nur ein Profil auf ${p.platform} hinterlegt, keine eigene Website. Vor dem Anruf kurz suchen – evtl. gibt es inzwischen eine.`
          : `Im Datenbestand (Stand ${p.c.scanAt ? p.c.scanAt.toISOString().slice(0, 10) : "unbekannt"}) ist keine Website hinterlegt. Vor dem Anruf kurz suchen – evtl. gibt es inzwischen eine.`,
      }));

    const cmp = compareRanked(day);
    const all = [...verified, ...cRows].sort(cmp);
    // Doppelte Identitaeten innerhalb der Liste entfernen.
    const seen = new Set<string>();
    const unique = all.filter((p) => {
      const keys = claimKeys({ leadfinderId: p.c.id, phoneNorm: p.phoneNorm, website: p.c.website, emailNorm: normalizeEmail(p.c.email) });
      if (keys.some((k) => seen.has(k))) return false;
      keys.forEach((k) => seen.add(k));
      return true;
    });
    // Reserve fuer Konflikte bei der Finalisierung: etwas mehr als noetig mitnehmen.
    const candidates = capPerPlzPrefix(unique, MAX_PER_PLZ_PREFIX).slice(0, targetCount + 15);

    if (lost) throw new PublicError("Erzeugung wurde von einem anderen Prozess übernommen.");
    await finalize(batchId, token, ownerId, day, candidates, deps.now());
  } finally {
    clearInterval(heartbeat);
  }
}

class StaleGenerationError extends Error {}

async function finalize(batchId: string, token: string, ownerId: string, day: string, candidates: Picked[], now: Date) {
  try {
    await prisma.$transaction(
      async (tx) => {
        // 1) Token-gebundene Statusaenderung ZUERST: ist der Token weg, rollt alles zurueck.
        const mine = await tx.callListBatch.updateMany({
          where: { id: batchId, genToken: token, state: "GENERATING" },
          data: { state: "READY", genToken: null, leaseUntil: null, finishedAt: now },
        });
        if (mine.count !== 1) throw new StaleGenerationError();
        const batch = await tx.callListBatch.findUniqueOrThrow({ where: { id: batchId }, select: { targetCount: true, keepUntilDone: true } });
        const expiresAt = batch.keepUntilDone ? null : endOfBerlinDay(day);

        let rank = 0;
        for (const p of candidates) {
          if (rank >= batch.targetCount) break;
          const emailNorm = normalizeEmail(p.c.email);
          const host = normalizeHost(p.c.website);
          // 2) Erneute Pruefung gegen dauerhafte Identitaeten (koennen seit dem Laden entstanden sein).
          const or: Prisma.SalesLeadWhereInput[] = [{ leadfinderId: p.c.id }, { phoneNorm: p.phoneNorm }];
          if (host) or.push({ websiteHost: host });
          if (emailNorm) or.push({ emailNorm });
          if (await tx.salesLead.findFirst({ where: { OR: or }, select: { id: true } })) continue;
          if (await tx.callBlock.findFirst({ where: { OR: or as Prisma.CallBlockWhereInput[] }, select: { id: true } })) continue;

          // 3) Claims atomar: neu anlegen oder abgelaufene uebernehmen.
          const entryId = randomUUID();
          const keys = claimKeys({ leadfinderId: p.c.id, phoneNorm: p.phoneNorm, website: p.c.website, emailNorm });
          let got = 0;
          for (const key of keys) {
            const rows = await tx.$queryRaw<Array<{ key: string }>>`
              INSERT INTO "CompanyClaim" ("key", "leadfinderId", "ownerId", "entryId", "expiresAt", "createdAt")
              VALUES (${key}, ${p.c.id}, ${ownerId}, ${entryId}, ${expiresAt}, ${now})
              ON CONFLICT ("key") DO UPDATE
                SET "leadfinderId" = EXCLUDED."leadfinderId", "ownerId" = EXCLUDED."ownerId",
                    "entryId" = EXCLUDED."entryId", "expiresAt" = EXCLUDED."expiresAt", "createdAt" = EXCLUDED."createdAt"
                WHERE "CompanyClaim"."expiresAt" <= ${now}
              RETURNING "key"`;
            if (rows.length !== 1) break;
            got++;
          }
          if (got !== keys.length) {
            await tx.companyClaim.deleteMany({ where: { entryId } });
            continue;
          }
          rank++;
          await tx.callListEntry.create({
            data: {
              id: entryId,
              batchId,
              leadfinderId: p.c.id,
              rank,
              tier: p.tier,
              reasonText: p.reasonText.slice(0, 500),
              siteCheck: (p.findings ?? undefined) as Prisma.InputJsonValue | undefined,
              companyName: p.c.name.slice(0, 200),
              phoneNorm: p.phoneNorm,
              website: p.c.website?.slice(0, 512) ?? null,
              email: p.c.email?.slice(0, 320) ?? null,
              plz: p.c.plz,
              city: p.city,
              isMobile: p.isMobile,
              sourceScanAt: p.c.scanAt,
            },
          });
        }
        await tx.callListBatch.update({
          where: { id: batchId },
          data: {
            actualCount: rank,
            note: rank < batch.targetCount ? `Nur ${rank} von ${batch.targetCount} passenden Kontakten gefunden.` : null,
          },
        });
      },
      { timeout: 30_000, maxWait: 10_000 }
    );
  } catch (err) {
    if (err instanceof StaleGenerationError) return; // anderer Erzeuger ist zustaendig
    throw err;
  }
}

// ── Anzeige ─────────────────────────────────────────────────────────────────

export async function loadCallView(ownerId: string, now: Date = new Date()) {
  const day = berlinDay(now);
  const batch = await prisma.callListBatch.findFirst({
    where: { ownerId, OR: [{ day: dayToDbDate(day) }, retainedBatchWhere(dayToDbDate(day))] },
    orderBy: { day: "asc" },
    include: { entries: { orderBy: { rank: "asc" } } },
  });
  const tasks = await prisma.callTask.findMany({
    where: { ownerId, state: "OPEN", nextAttemptAt: { lte: endOfBerlinDay(day) }, salesLead: { status: { notIn: ["WON", "LOST"] } } },
    orderBy: { nextAttemptAt: "asc" },
    include: {
      salesLead: {
        select: {
          id: true, companyName: true, contactName: true, phone: true, phoneNorm: true, website: true, status: true,
          callLogs: { orderBy: { createdAt: "desc" }, take: 1, select: { reached: true, outcome: true, notes: true, contactName: true, createdAt: true } },
        },
      },
    },
  });
  return { day, batch, tasks };
}
