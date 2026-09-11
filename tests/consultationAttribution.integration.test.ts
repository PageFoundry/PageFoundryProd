import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { checkSlotPolicy } from "../src/lib/consultation/policy";

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
  const email = `attribution-${Date.now()}@example.invalid`;
  try {
    const { POST } = await import("../app/api/consultation/route");
    for (let days = 2; days < 13 && slots.length < 2; days++) {
      for (const minute of [0, 30]) {
        const start = new Date(Date.now() + days * 86400000);
        start.setUTCHours(16, minute, 0, 0);
        const end = new Date(start.getTime() + 1800000);
        if (checkSlotPolicy(start, end, new Date()) !== null) continue;
        if (await prisma.consultationSlot.findUnique({ where: { start } })) continue;
        const row = await prisma.consultationSlot.create({ data: { start, end } });
        slots.push(row.id);
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
    await prisma.consultationSlot.deleteMany({ where: { id: { in: slots } } });
    await prisma.$disconnect();
  }
});
