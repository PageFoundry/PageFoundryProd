import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3011";
const prisma = new PrismaClient();
const touchedSlotIds = new Set();

after(async () => {
  const ids = [...touchedSlotIds];
  if (ids.length) {
    await prisma.consultationBooking.deleteMany({ where: { slotId: { in: ids } } });
    await prisma.consultationSlot.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
});

function berlinDate(daysAhead) {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function findBookableSlot() {
  for (let days = 2; days <= 12; days += 1) {
    const response = await fetch(`${BASE}/api/consultation/slots?date=${berlinDate(days)}`);
    assert.equal(response.status, 200);
    const body = await response.json();
    for (const slot of body.slots || []) touchedSlotIds.add(slot.id);
    if (body.slots?.length) return body.slots[0];
  }
  throw new Error("No bookable test slot found");
}

test("geschützte Checkout-URL bewahrt das interne Redirect-Ziel", async () => {
  const response = await fetch(`${BASE}/checkout/landing_page?from=flow-test`, {
    redirect: "manual",
  });
  assert.ok([307, 308].includes(response.status), `unexpected status ${response.status}`);
  const location = response.headers.get("location") || "";
  assert.match(location, /\/login\?next=/);
  assert.equal(new URL(location, BASE).searchParams.get("next"), "/checkout/landing_page?from=flow-test");
});

test("Passwort-Reset verrät nicht, ob ein Konto existiert", async () => {
  const unknown = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `unknown-${Date.now()}@example.com` }),
  });
  const invalid = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  assert.equal(unknown.status, 200);
  assert.equal(invalid.status, 200);
  assert.deepEqual(await unknown.json(), await invalid.json());
});

test("Beratung akzeptiert optionale Telefon-/Notizfelder und speichert den Paketkontext", async () => {
  const slot = await findBookableSlot();

  const invalid = await fetch(`${BASE}/api/consultation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "",
      email: "flow@example.com",
      slotId: slot.id,
      participants: -1,
      consultationType: "NOT_A_REAL_TYPE",
    }),
  });
  assert.equal(invalid.status, 400);

  const response = await fetch(`${BASE}/api/consultation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Flow Test",
      email: "flow@example.com",
      slotId: slot.id,
      participants: 1,
      consultationType: "LANDING_PAGE",
      packageKey: "landing_page",
    }),
  });
  assert.equal(response.status, 200, JSON.stringify(await response.json().catch(() => ({}))));

  const booking = await prisma.consultationBooking.findUniqueOrThrow({ where: { slotId: slot.id } });
  assert.match(booking.description, /Landingpage/i);
});

test("404-Seite liefert einen echten 404-Status", async () => {
  const response = await fetch(`${BASE}/gibt-es-garantiert-nicht-${Date.now()}`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /404/);
});
