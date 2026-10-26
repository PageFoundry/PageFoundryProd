import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { berlinParts, berlinWallClockToUtc, checkSlotPolicy } from "../src/lib/consultation/policy";

test("consultation provenance is validated, persisted and emitted exactly once", async () => {
  assert.equal(new URL(process.env.DATABASE_URL || "").pathname, "/pagefoundry_test");
  process.env.EMAIL_ENABLED = "false";
  process.env.CRM_BRIDGE_URL = "http://127.0.0.1:1";
  process.env.CRM_BRIDGE_TOKEN = "test-only";
  const events: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "http://127.0.0.1:1/events/pagefoundry");
    events.push(JSON.parse(String(options?.body)));
    return new Response("{}", { status: 200 });
  };
  const slots: string[] = [];
  // Die Test-DB kann das komplette, lazy erzeugte Slot-Raster bereits enthalten. Freie
  // vorhandene Slots werden deshalb mitbenutzt und danach zurückgesetzt; nur selbst
  // angelegte Slots werden gelöscht. Berliner Wanduhr statt fester UTC-Stunden, damit
  // die Suche bei Sommer- und Winterzeit dieselben Fenster trifft; 17–20 Uhr, weil
  // 16–17 Uhr mit Telefonterminen kollidieren kann.
  const createdSlots: string[] = [];
  const borrowedSlots: string[] = [];
  const email = `attribution-${Date.now()}@example.invalid`;
  try {
    const { POST } = await import("../app/api/consultation/route");
    const now = new Date();
    const today = berlinParts(now);
    for (let days = 2; days < 14 && slots.length < 2; days++) {
      const date = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
      for (const [hour, minute] of [[17, 0], [17, 30], [18, 0], [18, 30], [19, 0], [19, 30]]) {
        const start = berlinWallClockToUtc(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute);
        const end = new Date(start.getTime() + 1800000);
        if (checkSlotPolicy(start, end, now) !== null) continue;
        const dayStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
        const dayOff = await prisma.consultationDayOff.findFirst({ where: { date: { gte: dayStart, lt: new Date(dayStart.getTime() + 86400000) } } });
        if (dayOff) continue;
        const phone = await prisma.calendarEvent.findFirst({ where: { status: { not: "cancelled" }, startDateTime: { lt: end }, endDateTime: { gt: start } } });
        if (phone) continue;
        const existing = await prisma.consultationSlot.findUnique({ where: { start } });
        if (existing) {
          const reserved = existing.temporaryReservedUntil && existing.temporaryReservedUntil > now;
          if (existing.isBooked || existing.isDisabled || reserved) continue;
          borrowedSlots.push(existing.id);
          slots.push(existing.id);
        } else {
          const row = await prisma.consultationSlot.create({ data: { start, end } });
          createdSlots.push(row.id);
          slots.push(row.id);
        }
        if (slots.length === 2) break;
      }
    }
    assert.equal(slots.length, 2, "two isolated bookable slots available");
    const base = { name: "Test Attribution", email, phone: "", participants: 1, consultationType: "FULL_SITE_REVIEW", slotId: slots[0] };
    const post = (body: object) => POST(new NextRequest("http://localhost/api/consultation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    for (const bad of [{ observedSource: "verified_google" }, { selfReportedSource: "free text" }, { entryPathname: "/admin?token=secret" }, { entryPathname: "https://example.com/" }]) {
      assert.equal((await post({ ...base, ...bad })).status, 400);
    }
    assert.equal(events.length, 0);
    const attributed = { ...base, observedSource: "organic_search", selfReportedSource: "recommendation", entryPathname: "/seo-hueckeswagen" };
    assert.equal((await post(attributed)).status, 200);
    const booking = await prisma.consultationBooking.findUniqueOrThrow({ where: { slotId: slots[0] } });
    assert.equal(booking.observedSource, "organic_search");
    assert.equal(booking.selfReportedSource, "recommendation");
    assert.equal(booking.entryPathname, "/seo-hueckeswagen");
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "consultation.created");
    assert.equal(events[0].data.id, booking.id);
    assert.equal(events[0].data.entryPathname, "/seo-hueckeswagen");
    assert.match(events[0].data.summary, /Browser-Hinweis:/);
    assert.match(events[0].data.summary, /Selbstauskunft:/);
    assert.match(events[0].data.summary, /\/seo-hueckeswagen/);
    assert.equal((await post(attributed)).status, 409);
    assert.equal(events.length, 1, "retry must not emit a second CRM event");
    assert.equal((await post({ ...base, slotId: slots[1] })).status, 200);
    const legacy = await prisma.consultationBooking.findUniqueOrThrow({ where: { slotId: slots[1] } });
    assert.equal(legacy.observedSource, null);
    assert.equal(legacy.selfReportedSource, null);
    assert.equal(legacy.entryPathname, null);
    assert.equal(events.length, 2, "legacy clients remain supported");
  } finally {
    globalThis.fetch = originalFetch;
    await prisma.consultationBooking.deleteMany({ where: { slotId: { in: slots } } });
    await prisma.consultationSlot.updateMany({ where: { id: { in: borrowedSlots } }, data: { isBooked: false, temporaryReservedUntil: null } });
    await prisma.consultationSlot.deleteMany({ where: { id: { in: createdSlots } } });
    await prisma.$disconnect();
  }
});
