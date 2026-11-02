// HTTP-Tests der Anrufliste gegen den isolierten Test-Server aus scripts/test.sh (nie Prod).
// Leadfinder-Quelle: leadfinder_test (Fixture), Outreach: tests/fixtures/outreach-test.db,
// Website-Check: Fixture-Modus (kein echter Netzverkehr).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3011";
const prisma = new PrismaClient();
const stamp = Date.now().toString(36);
const users = {};

assert.equal(new URL(process.env.DATABASE_URL || "").pathname, "/pagefoundry_test");
assert.equal(new URL(process.env.LEADFINDER_DATABASE_URL || "").pathname, "/leadfinder_test");

async function makeUser(key, role, extra = {}) {
  const u = await prisma.user.create({ data: { email: `calls-${key}-${stamp}@example.invalid`, passwordHash: "x", role, name: `Test ${key}`, ...extra } });
  users[key] = u;
  return u;
}
const cookie = (u) => `pf_session=${jwt.sign({ sub: u.id, role: u.role, sv: u.sessionVersion }, process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME")}`;
async function api(u, path, method = "GET", body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect: "manual",
    headers: { ...(u ? { Cookie: cookie(u) } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
async function readyList(u) {
  for (let i = 0; i < 60; i++) {
    const r = await api(u, "/api/sales/calls");
    assert.equal(r.status, 200, JSON.stringify(r.data));
    if (r.data.batch.state === "READY") return r.data;
    if (r.data.batch.state === "FAILED") assert.fail(`Batch FAILED: ${r.data.batch.note}`);
    await new Promise((res) => setTimeout(res, 500));
  }
  assert.fail("Batch wurde nicht READY");
}
const byName = (list, name) => list.batch.entries.find((e) => e.companyName === name);
const confirm = (u, body) => api(u, "/api/sales/calls/confirm", "POST", { confirmed: true, ...body });
const log = (u, body) => api(u, "/api/sales/calls/log", "POST", body);
const past = () => new Date(Date.now() - 60_000);

const TEST_PHONES = ["+492192111111", "+492192222222", "+49231555555", "+491717777777", "+49221888888", "+49221999999", "+49231252525", "+49231424242"];

async function cleanup() {
  const ids = Object.values(users).map((u) => u.id);
  if (!ids.length) return;
  await prisma.companyClaim.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.callBlock.deleteMany({ where: { OR: [{ createdById: { in: ids } }, { phoneNorm: { in: TEST_PHONES } }] } });
  await prisma.callListBatch.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.salesLead.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

before(async () => {
  // Reste frueherer Laeufe mit denselben Fixture-Firmen entfernen (Claims/Leads/Sperren).
  await prisma.companyClaim.deleteMany({ where: { leadfinderId: { startsWith: "lf" } } });
  await prisma.callBlock.deleteMany({ where: { phoneNorm: { in: TEST_PHONES } } });
  await prisma.salesLead.deleteMany({ where: { leadfinderId: { startsWith: "lf" } } });
  await makeUser("rep", "SALES", { referralCode: `crep-${stamp}`, commissionPercent: 20 });
  await makeUser("rep2", "SALES", { referralCode: `crep2-${stamp}`, commissionPercent: 20 });
  await makeUser("admin", "ADMIN");
  await makeUser("user", "USER");
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

let list;

test("Rollen: USER/Anonym 403, ADMIN nur lesend", async () => {
  assert.equal((await api(null, "/api/sales/calls")).status, 403);
  assert.equal((await api(users.user, "/api/sales/calls")).status, 403);
  const a = await api(users.admin, "/api/sales/calls");
  assert.equal(a.status, 200);
  assert.equal(a.data.admin, true);
  assert.equal(await prisma.callListBatch.count({ where: { ownerId: users.admin.id } }), 0, "ADMIN erzeugt keine Liste");
});

test("Tagesliste: parallele Aufrufe -> genau ein Batch; Auswahl, Ausschluesse und Reihenfolge", async () => {
  const parallel = await Promise.all(Array.from({ length: 5 }, () => api(users.rep, "/api/sales/calls")));
  for (const r of parallel) assert.equal(r.status, 200);
  assert.equal(await prisma.callListBatch.count({ where: { ownerId: users.rep.id } }), 1);
  list = await readyList(users.rep);
  const names = list.batch.entries.map((e) => e.companyName);
  assert.deepEqual(names, [
    "Malerbetrieb Alpha", // A, Festnetz, E-Mail
    "Pizzeria Bella", // A, Festnetz, nationale 0-Nummer mit NRW-Koordinaten
    "Tischlerei Weakwood", // B, Festnetz, E-Mail
    "Glaserei Weakglas", // B, Festnetz, ohne E-Mail
    "Autohaus Mobilnummer", // B, Mobil -> abgewertet
    "Kosmetikstudio Ohneweb", // C, E-Mail
    "Blumen Ohneweb", // C
  ]);
  assert.match(list.batch.note, /Nur 7 von 30/);
  assert.equal(byName(list, "Malerbetrieb Alpha").tier, "A");
  assert.match(byName(list, "Malerbetrieb Alpha").reasonText, /nicht erreichbar/);
  assert.equal(byName(list, "Autohaus Mobilnummer").isMobile, true);
  // Ausgeschlossen: Live-OK (Comeback, Gutseite), UNKNOWN, FR, Kette, Bank, Person, Mismatch, closed, Muenchen, Outreach angemailt/Rechtsrisiko
  for (const n of ["Elektro Comeback", "Bäckerei Gutseite", "Friseur Unklar", "Boulangerie Française", "Café Paris", "Kette Filiale 1", "Sparkasse Musterstadt", "Uwe Mustermann", "Getränke Mismatch", "Metzgerei Geschlossen", "Optik Muenchen", "Dachdecker Angemailt", "Fliesen Rechtsrisiko"]) {
    assert.ok(!names.includes(n), `${n} darf nicht in der Liste sein`);
  }
});

test("Reservierung: zweiter Verkaeufer bekommt dieselben Firmen nicht", async () => {
  const l2 = await readyList(users.rep2);
  assert.equal(l2.batch.entries.length, 0);
  assert.match(l2.batch.note, /Nur 0 von 30/);
});

test("Bestaetigen: fremder Eintrag 404, ohne Haken 400, Doppelklick -> derselbe Versuch, Lead entsteht vor dem Anruf", async () => {
  const alpha = byName(list, "Malerbetrieb Alpha");
  assert.equal((await confirm(users.rep2, { entryId: alpha.id })).status, 404);
  assert.equal((await api(users.rep, "/api/sales/calls/confirm", "POST", { entryId: alpha.id })).status, 400);
  assert.equal((await confirm(users.admin, { entryId: alpha.id })).status, 403, "ADMIN protokolliert nicht");
  const [a, b] = await Promise.all([confirm(users.rep, { entryId: alpha.id }), confirm(users.rep, { entryId: alpha.id })]);
  assert.equal(a.status, 200, JSON.stringify(a.data));
  assert.equal(b.status, 200, JSON.stringify(b.data));
  assert.equal(a.data.attemptId, b.data.attemptId);
  assert.equal(a.data.phone, "+492192111111");
  const lead = await prisma.salesLead.findUnique({ where: { leadfinderId: "lfA1" } });
  assert.equal(lead.ownerId, users.rep.id);
  assert.equal(lead.phoneNorm, "+492192111111");
});

let demoId;
test("Protokoll: Demo vereinbart -> Pflichtfelder, idempotent, Status MEETING, Demo-Anfrage", async () => {
  const alpha = byName(list, "Malerbetrieb Alpha");
  const { data: att } = await confirm(users.rep, { entryId: alpha.id });
  assert.equal((await log(users.rep2, { attemptId: att.attemptId, reached: "NOT_REACHED" })).status, 404, "fremder Versuch");
  const bad = await log(users.rep, { attemptId: att.attemptId, reached: "REACHED", outcome: "DEMO_BOOKED", demoEmail: "chef@alpha.example" });
  assert.equal(bad.status, 400);
  const body = { attemptId: att.attemptId, reached: "REACHED", outcome: "DEMO_BOOKED", contactName: "Frau Alpha", contactRole: "Inhaberin", isDecisionMaker: true, demoEmail: "chef@alpha.example", demoBriefing: "Malerbetrieb in Hückeswagen, will Anfragen für Fassaden, Farben blau/weiß, Logo vorhanden", packageInterest: "gefunden" };
  const [r1, r2] = await Promise.all([log(users.rep, body), log(users.rep, body)]);
  assert.equal(r1.status, 200, JSON.stringify(r1.data));
  assert.equal(r2.status, 200, JSON.stringify(r2.data));
  assert.equal([r1.data.duplicate, r2.data.duplicate].filter(Boolean).length, 1, "genau ein Duplikat");
  const lead = await prisma.salesLead.findUnique({ where: { leadfinderId: "lfA1" }, include: { callLogs: true, demoRequests: true } });
  assert.equal(lead.callLogs.length, 1);
  assert.equal(lead.status, "MEETING");
  assert.equal(lead.contactName, "Frau Alpha");
  assert.equal(lead.demoRequests.length, 1);
  assert.equal(lead.demoRequests[0].state, "REQUESTED");
  demoId = lead.demoRequests[0].id;
  const entry = await prisma.callListEntry.findUnique({ where: { id: alpha.id } });
  assert.equal(entry.status, "DONE");
  assert.equal((await confirm(users.rep, { entryId: alpha.id })).status, 409, "erledigter Eintrag nicht erneut");
});

test("Demo-Ablauf: Admin traegt Link ein, Vertrieb sieht Entwurf; Versand faellt bei deaktivierter Mail sauber zurueck", async () => {
  assert.equal((await api(users.rep, `/api/sales/demos/${demoId}`, "PATCH", { state: "READY", demoUrl: "https://x.example" })).status, 403);
  assert.equal((await api(users.admin, `/api/sales/demos/${demoId}`, "PATCH", { state: "READY", demoUrl: "http://unsicher.example" })).status, 400);
  const ok = await api(users.admin, `/api/sales/demos/${demoId}`, "PATCH", { state: "READY", demoUrl: "https://demo.pagefoundry.de/alpha/", adminNote: "Farben angepasst" });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  const mine = await api(users.rep, "/api/sales/demos");
  const d = mine.data.demos.find((x) => x.id === demoId);
  assert.equal(d.state, "READY");
  assert.match(d.draftMessage, /https:\/\/demo\.pagefoundry\.de\/alpha\//);
  assert.match(d.draftMessage, /Guten Tag Frau Alpha/);
  assert.equal((await api(users.rep2, "/api/sales/demos")).data.demos.length, 0, "fremde Demos unsichtbar");
  assert.equal((await api(users.rep, `/api/sales/demos/${demoId}/send`, "POST", { message: "zu kurz" })).status, 400);
  assert.equal((await api(users.rep, `/api/sales/demos/${demoId}/send`, "POST", { message: "Hallo, hier ein Text ohne den Link, der lang genug ist für die Prüfung." })).status, 400);
  const sent = await api(users.rep, `/api/sales/demos/${demoId}/send`, "POST", { message: d.draftMessage });
  assert.equal(sent.status, 503, "Testumgebung: EMAIL_ENABLED=false");
  assert.equal((await prisma.demoRequest.findUnique({ where: { id: demoId } })).state, "READY", "Status zurueckgesetzt");
});

test("Wiedervorlage: 3 Fehlversuche ueber Tage, nicht faellig -> 409, danach Schluss", async () => {
  const bella = byName(list, "Pizzeria Bella");
  let { data: att } = await confirm(users.rep, { entryId: bella.id });
  assert.equal((await log(users.rep, { attemptId: att.attemptId, reached: "NOT_REACHED" })).status, 200);
  const lead = await prisma.salesLead.findUnique({ where: { leadfinderId: "lfA2" } });
  let task = await prisma.callTask.findUnique({ where: { salesLeadId: lead.id } });
  assert.equal(task.kind, "RETRY");
  assert.equal(task.failedAttempts, 1);
  assert.ok(task.nextAttemptAt > new Date());
  assert.equal((await confirm(users.rep, { taskId: task.id })).data.code, "TASK_NOT_DUE");
  assert.equal((await confirm(users.rep2, { taskId: task.id })).status, 404);

  await prisma.callTask.update({ where: { id: task.id }, data: { nextAttemptAt: past() } });
  ({ data: att } = await confirm(users.rep, { taskId: task.id }));
  assert.ok(att.attemptId);
  assert.equal((await log(users.rep, { attemptId: att.attemptId, reached: "VOICEMAIL" })).status, 200);
  task = await prisma.callTask.findUnique({ where: { id: task.id } });
  assert.equal(task.failedAttempts, 2);
  assert.equal(task.state, "OPEN");

  await prisma.callTask.update({ where: { id: task.id }, data: { nextAttemptAt: past() } });
  const view = await api(users.rep, "/api/sales/calls");
  assert.ok(view.data.tasks.some((t) => t.id === task.id), "faellige Wiedervorlage steht in der Ansicht");
  ({ data: att } = await confirm(users.rep, { taskId: task.id }));
  assert.equal((await log(users.rep, { attemptId: att.attemptId, reached: "NOT_REACHED" })).status, 200);
  task = await prisma.callTask.findUnique({ where: { id: task.id } });
  assert.equal(task.state, "DONE");
  assert.equal(task.failedAttempts, 3);
  assert.equal((await confirm(users.rep, { taskId: task.id })).data.code, "TASK_CLOSED");
});

test("Nicht mehr anrufen: zentrale Sperre, gilt auch fuer outreach-demo", async () => {
  const wood = byName(list, "Tischlerei Weakwood");
  const { data: att } = await confirm(users.rep, { entryId: wood.id });
  assert.equal((await log(users.rep, { attemptId: att.attemptId, reached: "REACHED", outcome: "DO_NOT_CALL" })).status, 200);
  const block = await prisma.callBlock.findUnique({ where: { phoneNorm: "+49231555555" } });
  assert.ok(block);
  assert.equal(block.websiteHost, "weak-wood.example");
  // Gleiche Pruefung, die outreach-demo vor jeder Mail ausfuehrt:
  const { createCallBlockChecker } = await import("/home/ubuntu/outreach-demo/src/callBlocks.mjs");
  const checker = await createCallBlockChecker(process.env.DATABASE_URL);
  try {
    assert.equal(await checker.isBlocked({ phone: "0231 555555" }), true);
    assert.equal(await checker.isBlocked({ website: "https://www.weak-wood.example/kontakt" }), true);
    assert.equal(await checker.isEmailBlocked("kontakt@weak-wood.example"), true);
    assert.equal(await checker.isBlocked({ phone: "0231 000000", website: "andere.example" }), false);
  } finally {
    await checker.close();
  }
  await assert.rejects(() => createCallBlockChecker(""), /PF_CALLBLOCK_DB_URL fehlt/);
});

test("Sperre nach Listenerzeugung blockiert die Freigabe", async () => {
  const blumen = byName(list, "Blumen Ohneweb");
  await prisma.callBlock.create({ data: { phoneNorm: "+49221888888", companyName: "Blumen Ohneweb", reason: "Test", createdById: users.admin.id } });
  const r = await confirm(users.rep, { entryId: blumen.id });
  assert.equal(r.status, 409);
  assert.equal(r.data.code, "BLOCKED");
  assert.equal((await prisma.callListEntry.findUnique({ where: { id: blumen.id } })).status, "BLOCKED");
});

test("Rueckruf + Admin-Abschluss beendet Wiedervorlage; Telefonwechsel entwertet offenen Versuch", async () => {
  const kos = byName(list, "Kosmetikstudio Ohneweb");
  let { data: att } = await confirm(users.rep, { entryId: kos.id });
  const cb = new Date(Date.now() + 2 * 86_400_000).toISOString();
  assert.equal((await log(users.rep, { attemptId: att.attemptId, reached: "REACHED", outcome: "CALLBACK", callbackAt: cb, objection: "NO_TIME" })).status, 200);
  const lead = await prisma.salesLead.findUnique({ where: { leadfinderId: "lfC2" } });
  let task = await prisma.callTask.findUnique({ where: { salesLeadId: lead.id } });
  assert.equal(task.kind, "CALLBACK");
  assert.equal(task.state, "OPEN");

  // Telefonnummer aendern -> offene Versuche verfallen
  await prisma.callTask.update({ where: { id: task.id }, data: { nextAttemptAt: past() } });
  ({ data: att } = await confirm(users.rep, { taskId: task.id }));
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { phone: "0221 123123" })).status, 200);
  assert.equal((await prisma.salesLead.findUnique({ where: { id: lead.id } })).phoneNorm, "+49221123123");
  assert.equal((await log(users.rep, { attemptId: att.attemptId, reached: "REACHED", outcome: "NO_INTEREST" })).status, 410);

  // Nummer eines anderen Leads -> 409
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { phone: "+49 2192 111111" })).status, 409);

  assert.equal((await api(users.admin, `/api/sales/leads/${lead.id}`, "PATCH", { status: "WON", oneTimeValueCents: 79000 })).status, 200);
  task = await prisma.callTask.findUnique({ where: { id: task.id } });
  assert.equal(task.state, "CANCELLED");
  assert.equal((await confirm(users.rep, { taskId: task.id })).status, 409);
});

test("Nummernkorrektur: erneute Freigabe waehlt die neue Nummer, Widerspruch sperrt die gewaehlte", async () => {
  const mobil = byName(list, "Autohaus Mobilnummer");
  const first = await confirm(users.rep, { entryId: mobil.id });
  assert.equal(first.data.phone, "+491717777777");
  const lead = await prisma.salesLead.findUnique({ where: { leadfinderId: "lfB3" } });
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { phone: "0231 424242" })).status, 200);
  assert.equal((await log(users.rep, { attemptId: first.data.attemptId, reached: "NOT_REACHED" })).status, 410, "alter Versuch verfallen");
  const second = await confirm(users.rep, { entryId: mobil.id });
  assert.equal(second.status, 200, JSON.stringify(second.data));
  assert.notEqual(second.data.attemptId, first.data.attemptId);
  assert.equal(second.data.phone, "+49231424242");
  assert.equal((await log(users.rep, { attemptId: second.data.attemptId, reached: "REACHED", outcome: "DO_NOT_CALL" })).status, 200);
  assert.ok(await prisma.callBlock.findUnique({ where: { phoneNorm: "+49231424242" } }), "gewaehlte Nummer gesperrt");
  assert.equal(await prisma.callBlock.findUnique({ where: { phoneNorm: "+491717777777" } }), null);
});

test("Abgeschlossener Lead: offener Versuch wird nicht wieder freigegeben, Stammdaten bleiben", async () => {
  const glas = byName(list, "Glaserei Weakglas");
  const { data: att } = await confirm(users.rep, { entryId: glas.id });
  const lead = await prisma.salesLead.findUnique({ where: { leadfinderId: "lfB4" } });
  assert.equal((await api(users.admin, `/api/sales/leads/${lead.id}`, "PATCH", { status: "LOST" })).status, 200);
  const again = await confirm(users.rep, { entryId: glas.id });
  assert.equal(again.status, 409);
  assert.equal(again.data.code, "LEAD_TAKEN");
  assert.equal((await prisma.callListEntry.findUnique({ where: { id: glas.id } })).status, "BLOCKED");
  const r = await log(users.rep, { attemptId: att.attemptId, reached: "REACHED", outcome: "HAS_NEW_WEBSITE", newWebsite: "neue-glaserei.example", contactName: "Herr Glas" });
  assert.equal(r.status, 200, "Historie wird gespeichert");
  const after = await prisma.salesLead.findUnique({ where: { id: lead.id } });
  assert.equal(after.websiteHost, "weak-glas.example", "Website unveraendert");
  assert.equal(after.contactName, null, "Kontaktperson unveraendert");
  assert.equal(after.status, "LOST");
});

test("Vertragsvorlagen: nur Whitelist, nur Vertrieb", async () => {
  assert.equal((await fetch(`${BASE}/api/sales/documents/01_Website-Erstellungsvertrag.pdf`, { headers: { Cookie: cookie(users.user) } })).status, 403);
  assert.equal((await fetch(`${BASE}/api/sales/documents/..%2F..%2Fetc%2Fpasswd`, { headers: { Cookie: cookie(users.rep) } })).status, 404);
  const r = await fetch(`${BASE}/api/sales/documents/01_Website-Erstellungsvertrag.pdf`, { headers: { Cookie: cookie(users.rep) } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/pdf");
});
