// Generator der Tagesliste direkt gegen die Test-DB, mit injizierten Quellen (kein Netz,
// keine Leadfinder-DB). Prueft Lease-Uebernahme, veralteten Erzeuger, fail-closed.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { prisma } from "../src/lib/prisma";
import { generate, getOrStartBatch, loadCallView, type GenDeps } from "../src/lib/sales/callList";
import { berlinDay, dayToDbDate } from "../src/lib/sales/callGuide";
import { confirmCall } from "../src/lib/sales/callService";
import type { LfCandidate } from "../src/lib/sales/ranking";

assert.equal(new URL(process.env.DATABASE_URL || "").pathname, "/pagefoundry_test");
const stamp = Date.now().toString(36);
const created: string[] = [];

async function seller(key: string) {
  const u = await prisma.user.create({ data: { email: `gen-${key}-${stamp}@example.invalid`, passwordHash: "x", role: "SALES" } });
  created.push(u.id);
  return u;
}

const cand = (id: string, phone: string): LfCandidate => ({
  id, name: `Malerbetrieb ${id}`, website: null, email: null, phone, plz: "42499", scanAt: new Date("2026-06-01"),
  salesProblemScore: 100, reasonKeys: ["no_website"], phoneDupCount: 1,
});

function deps(over: Partial<GenDeps> = {}): GenDeps {
  return {
    fetchCandidates: async ({ tier }) => (tier === "C" ? [cand(`g1-${stamp}`, "+49 2192 900001"), cand(`g2-${stamp}`, "+49 2192 900002")] : []),
    loadExclusions: () => ({ leadfinderIds: new Set(), domains: new Set(), emails: new Set() }),
    checkSite: async () => { throw new Error("darf nicht aufgerufen werden"); },
    now: () => new Date(),
    ...over,
  };
}

after(async () => {
  await prisma.companyClaim.deleteMany({ where: { ownerId: { in: created } } });
  await prisma.callListBatch.deleteMany({ where: { ownerId: { in: created } } });
  await prisma.salesLead.deleteMany({ where: { ownerId: { in: created } } });
  await prisma.user.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
});

test("Veralteter Erzeuger schreibt nichts, wenn sein Token uebernommen wurde", async () => {
  const u = await seller("stale");
  const day = berlinDay();
  const batch = await prisma.callListBatch.create({
    data: { ownerId: u.id, day: dayToDbDate(day), state: "GENERATING", genToken: "neuer-token", leaseUntil: new Date(Date.now() + 60_000), targetCount: 30 },
  });
  await generate(batch.id, "alter-token", u.id, day, deps());
  const after1 = await prisma.callListBatch.findUniqueOrThrow({ where: { id: batch.id }, include: { entries: true } });
  assert.equal(after1.state, "GENERATING");
  assert.equal(after1.genToken, "neuer-token");
  assert.equal(after1.entries.length, 0);
  assert.equal(await prisma.companyClaim.count({ where: { ownerId: u.id } }), 0, "keine Claims vom alten Erzeuger");
  // Der aktuelle Erzeuger darf fertigstellen
  await generate(batch.id, "neuer-token", u.id, day, deps());
  const done = await prisma.callListBatch.findUniqueOrThrow({ where: { id: batch.id }, include: { entries: true } });
  assert.equal(done.state, "READY");
  assert.equal(done.entries.length, 2);
  assert.equal(await prisma.companyClaim.count({ where: { ownerId: u.id } }), 4, "je Firma lf + ph");
});

test("Abgelaufene Lease wird uebernommen, gueltige nicht", async () => {
  const u = await seller("lease");
  const day = berlinDay();
  const b = await prisma.callListBatch.create({
    data: { ownerId: u.id, day: dayToDbDate(day), state: "GENERATING", genToken: "t1", leaseUntil: new Date(Date.now() + 60_000), targetCount: 30 },
  });
  const slow = deps({ fetchCandidates: () => new Promise(() => {}) }); // haengt absichtlich
  await getOrStartBatch(u.id, slow);
  assert.equal((await prisma.callListBatch.findUniqueOrThrow({ where: { id: b.id } })).genToken, "t1", "gueltige Lease bleibt");
  await prisma.callListBatch.update({ where: { id: b.id }, data: { leaseUntil: new Date(Date.now() - 1000) } });
  await getOrStartBatch(u.id, slow);
  const taken = await prisma.callListBatch.findUniqueOrThrow({ where: { id: b.id } });
  assert.notEqual(taken.genToken, "t1", "abgelaufene Lease uebernommen");
  assert.equal(taken.state, "GENERATING");
});

test("Outreach-Sperrliste nicht lesbar -> FAILED mit Hinweis, keine Eintraege", async () => {
  const u = await seller("failclosed");
  const broken = deps({ loadExclusions: () => { throw new Error("SQLITE_CANTOPEN"); } });
  const b = await getOrStartBatch(u.id, broken);
  for (let i = 0; i < 40; i++) {
    const cur = await prisma.callListBatch.findUniqueOrThrow({ where: { id: b.id } });
    if (cur.state !== "GENERATING") break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const res = await prisma.callListBatch.findUniqueOrThrow({ where: { id: b.id }, include: { entries: true } });
  assert.equal(res.state, "FAILED");
  assert.match(res.note || "", /Sperrliste/);
  assert.equal(res.entries.length, 0);
});

test("20er-Liste bleibt nach Mitternacht aufrufbar und reserviert, bis alle Kontakte bearbeitet sind", async () => {
  const u = await seller("retained");
  const other = await seller("retained-other");
  const now = new Date();
  const previous = new Date(now.getTime() - 3 * 86400_000);
  const day = berlinDay(previous);
  const plz = ["42499", "44135", "45127", "50667", "53111", "40210", "41061", "33602"];
  const candidates = Array.from({ length: 24 }, (_, i) => ({
    ...cand(`retained-${stamp}-${i}`, `+4921929${10000 + i}`), plz: plz[Math.floor(i / 3)],
  }));
  const sources = deps({
    fetchCandidates: async ({ tier }) => tier === "C" ? candidates : [],
    now: () => previous,
  });
  const batch = await prisma.callListBatch.create({
    data: { ownerId: u.id, day: dayToDbDate(day), targetCount: 20, keepUntilDone: true, genToken: "retained", leaseUntil: now },
  });
  await generate(batch.id, "retained", u.id, day, sources);
  const ready = await prisma.callListBatch.findUniqueOrThrow({ where: { id: batch.id }, include: { entries: true } });
  assert.equal(ready.actualCount, 20);
  assert.equal(ready.entries.length, 20);
  assert.equal(ready.note, null);
  assert.equal(await prisma.companyClaim.count({ where: { ownerId: u.id, expiresAt: null } }), 40);

  const todaySources = { ...sources, now: () => now };
  assert.equal((await getOrStartBatch(u.id, todaySources)).id, batch.id);
  const view = await loadCallView(u.id, now);
  assert.equal(view.batch?.id, batch.id);
  assert.equal(view.batch?.entries.filter((entry) => entry.status === "OPEN").length, 20);
  assert.equal(await prisma.callListBatch.count({ where: { ownerId: u.id } }), 1);

  const competing = await prisma.callListBatch.create({
    data: { ownerId: other.id, day: dayToDbDate(berlinDay(now)), targetCount: 30, genToken: "other", leaseUntil: now },
  });
  await generate(competing.id, "other", other.id, berlinDay(now), todaySources);
  const otherEntries = await prisma.callListEntry.findMany({ where: { batchId: competing.id } });
  assert.equal(otherEntries.length, 4);
  const reserved = new Set(ready.entries.map((entry) => entry.leadfinderId));
  assert(otherEntries.every((entry) => !reserved.has(entry.leadfinderId)));

  const first = ready.entries[0];
  const confirmed = await confirmCall({ sub: u.id, role: "SALES", sv: u.sessionVersion }, { entryId: first.id }, now);
  assert(confirmed.attemptId, "Reservierung ohne Ablauf bleibt nach dem Tageswechsel anrufbar");
  await prisma.callListEntry.updateMany({ where: { batchId: batch.id, NOT: { id: first.id } }, data: { status: "DONE" } });
  assert.equal((await getOrStartBatch(u.id, todaySources)).id, batch.id, "Ein offener Kontakt hält die Liste fest");
  await prisma.callListEntry.update({ where: { id: first.id }, data: { status: "DONE" } });
  const next = await getOrStartBatch(u.id, deps({ now: () => now, fetchCandidates: () => new Promise(() => {}) }));
  assert.notEqual(next.id, batch.id, "Erst nach dem letzten Kontakt darf eine neue Liste entstehen");
  assert.equal(next.day.toISOString(), dayToDbDate(berlinDay(now)).toISOString());
});

test("Normale Tageslisten verfallen weiterhin mit ihren befristeten Reservierungen", async () => {
  const u = await seller("daily-expiry");
  const now = new Date();
  const previous = new Date(now.getTime() - 3 * 86400_000);
  const day = berlinDay(previous);
  const batch = await prisma.callListBatch.create({
    data: { ownerId: u.id, day: dayToDbDate(day), targetCount: 30, genToken: "daily", leaseUntil: now },
  });
  const candidates = [cand(`daily-${stamp}`, "+492192999881")];
  await generate(batch.id, "daily", u.id, day, deps({ now: () => previous, fetchCandidates: async ({ tier }) => tier === "C" ? candidates : [] }));
  assert.equal(await prisma.companyClaim.count({ where: { ownerId: u.id, expiresAt: { lt: now } } }), 2);
  const next = await getOrStartBatch(u.id, deps({ now: () => now, fetchCandidates: () => new Promise(() => {}) }));
  assert.notEqual(next.id, batch.id);
  assert.equal(await prisma.callListEntry.count({ where: { batchId: batch.id, status: "EXPIRED" } }), 1);
});
