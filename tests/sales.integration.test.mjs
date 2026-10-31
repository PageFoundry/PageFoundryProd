// HTTP-Tests gegen den isolierten Test-Server aus scripts/test.sh (nie Prod).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3011";
const prisma = new PrismaClient();
const stamp = Date.now().toString(36);
const users = {};
const touchedSlotIds = new Set();

assert.equal(new URL(process.env.DATABASE_URL || "").pathname, "/pagefoundry_test");

async function makeUser(key, role, extra = {}) {
  const u = await prisma.user.create({
    data: { email: `sales-test-${key}-${stamp}@example.invalid`, passwordHash: "x", role, ...extra },
  });
  users[key] = u;
  return u;
}
const cookie = (u) => `pf_session=${jwt.sign({ sub: u.id, role: u.role, sv: u.sessionVersion }, process.env.JWT_SECRET || "DEV_ONLY_CHANGE_ME")}`;
const api = (u, path, method = "GET", body) =>
  fetch(`${BASE}${path}`, {
    method,
    redirect: "manual",
    headers: { ...(u ? { Cookie: cookie(u) } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

before(async () => {
  await makeUser("user", "USER");
  await makeUser("rep", "SALES", { referralCode: `rep-${stamp}`, commissionPercent: 20 });
  await makeUser("rep2", "SALES", { referralCode: `rep2-${stamp}`, commissionPercent: 20 });
  await makeUser("admin", "ADMIN");
  await makeUser("plain", "USER", { referralCode: `plain-${stamp}` });
});

after(async () => {
  const ids = Object.values(users).map((u) => u.id);
  await prisma.salesLead.deleteMany({ where: { ownerId: { in: ids } } });
  const slotIds = [...touchedSlotIds];
  if (slotIds.length) {
    await prisma.consultationBooking.deleteMany({ where: { slotId: { in: slotIds } } });
    await prisma.consultationSlot.updateMany({ where: { id: { in: slotIds } }, data: { isBooked: false } });
  }
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test("Rollen-Grenzen: USER kommt nicht ins Portal, SALES nicht in Admin", async () => {
  assert.equal((await api(null, "/api/sales/leads")).status, 403);
  assert.equal((await api(users.user, "/api/sales/leads")).status, 403);
  const userPage = await api(users.user, "/sales");
  assert.ok([303, 307].includes(userPage.status), `USER /sales -> ${userPage.status}`);
  assert.equal(new URL(userPage.headers.get("location"), BASE).pathname, "/dashboard");

  assert.equal((await api(users.rep, "/sales")).status, 200);
  assert.equal((await api(users.admin, "/sales")).status, 200);
  for (const path of ["/api/admin/hq", "/api/admin/orders", "/api/admin/knowledge-graph", "/api/admin/outreach/status"]) {
    const r = await api(users.rep, path);
    assert.ok([401, 403].includes(r.status), `SALES ${path} -> ${r.status}`);
  }
  for (const path of ["/admin", "/admin/hq", "/outreach"]) {
    const r = await api(users.rep, path);
    assert.notEqual(r.status, 200, `SALES ${path} -> 200`);
  }
});

test("Lead-Schutz, Statusrechte und Provision", async () => {
  const host = `lead-${stamp}.example`;
  const created = await api(users.rep, "/api/sales/leads", "POST", { companyName: "Testfirma", website: `https://www.${host}/kontakt`, email: `Info@${host}` });
  assert.equal(created.status, 201);
  const { lead } = await created.json();
  assert.equal(lead.owner.id, users.rep.id);

  // gleicher Host / gleiche E-Mail bei anderem Verkaeufer -> 409
  assert.equal((await api(users.rep2, "/api/sales/leads", "POST", { companyName: "Dublette", website: host })).status, 409);
  assert.equal((await api(users.rep2, "/api/sales/leads", "POST", { companyName: "Dublette", email: `info@${host.toUpperCase()}` })).status, 409);

  // parallele Anlage: genau einer gewinnt
  const raceHost = `race-${stamp}.example`;
  const race = await Promise.all([users.rep, users.rep2].map((u) => api(u, "/api/sales/leads", "POST", { companyName: "Race", website: raceHost })));
  assert.deepEqual(race.map((r) => r.status).sort(), [201, 409]);

  // Sichtbarkeit: rep2 sieht den Lead von rep nicht und darf ihn nicht aendern
  const rep2List = await (await api(users.rep2, "/api/sales/leads")).json();
  assert.ok(!rep2List.leads.some((l) => l.id === lead.id));
  assert.equal((await api(users.rep2, `/api/sales/leads/${lead.id}`, "PATCH", { notes: "fremd" })).status, 404);

  // SALES: Status bis OFFER ja, WON nein, Betraege nein
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { status: "OFFER" })).status, 200);
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { status: "WON" })).status, 403);
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { oneTimeValueCents: 1 })).status, 403);

  // ADMIN schliesst ab: Satz wird eingefroren
  const won = await api(users.admin, `/api/sales/leads/${lead.id}`, "PATCH", { status: "WON", oneTimeValueCents: 139000, monthlyValueCents: 7900 });
  assert.equal(won.status, 200);
  const wonLead = (await won.json()).lead;
  assert.equal(wonLead.commissionPercentAtWin, 20);
  assert.ok(wonLead.wonAt);
  await prisma.user.update({ where: { id: users.rep.id }, data: { commissionPercent: 30 } });
  const stored = await prisma.salesLead.findUnique({ where: { id: lead.id } });
  assert.equal(stored.commissionPercentAtWin, 20, "spaetere Satzaenderung wirkt nicht rueckwirkend");

  // abgeschlossener Lead ist fuer SALES gesperrt
  assert.equal((await api(users.rep, `/api/sales/leads/${lead.id}`, "PATCH", { status: "NEW" })).status, 403);

  // ADMIN sieht alle
  const adminList = await (await api(users.admin, "/api/sales/leads")).json();
  assert.ok(adminList.leads.some((l) => l.id === lead.id));
});

function berlinDate(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 86400000);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
async function freeSlots(n) {
  const out = [];
  for (let days = 2; days <= 14 && out.length < n; days++) {
    const body = await (await fetch(`${BASE}/api/consultation/slots?date=${berlinDate(days)}`)).json();
    for (const s of body.slots || []) {
      if (out.length < n) { out.push(s.id); touchedSlotIds.add(s.id); }
    }
  }
  assert.equal(out.length, n, "genug freie Test-Slots");
  return out;
}

test("Empfehlungslink ordnet Buchungen nur echten SALES-Usern zu", async () => {
  const [s1, s2, s3] = await freeSlots(3);
  const book = (slotId, referralCode) =>
    api(null, "/api/consultation", "POST", { name: "Ref Test", email: `ref-${stamp}@example.invalid`, slotId, consultationType: "FULL_SITE_REVIEW", referralCode });
  const cases = [[s1, users.rep.referralCode, users.rep.id], [s2, `unknown-${stamp}`, null], [s3, users.plain.referralCode, null]];
  for (const [slotId, code, expected] of cases) {
    const r = await book(slotId, code);
    assert.equal(r.status, 200, `Buchung mit ${code} -> ${r.status}`);
    const b = await prisma.consultationBooking.findUnique({ where: { slotId } });
    assert.equal(b.referredById, expected, `Code ${code}`);
  }
});
