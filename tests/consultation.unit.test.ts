import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { bookSlot, SlotUnavailableError } from "../src/lib/consultation/booking";
import { berlinWallClockToUtc, checkSlotPolicy, SLOT_MINUTES } from "../src/lib/consultation/policy";
import { calendarProvider } from "../src/lib/retell/calendar";

// Testdaten liegen 2030 — weit weg von echten Slots (max. 14 Tage voraus), damit die
// Unique-Constraint auf ConsultationSlot.start nicht mit dem Live-Bestand kollidiert.
// Der Bezugszeitpunkt wird an bookSlot() durchgereicht, die Policy prüft also gegen 2030.
const NOW_2030 = new Date("2030-05-01T09:00:00Z");
const PREFIX = `test-consultation-${Date.now()}`;

// 2030-05-06 = Mo, -07 = Di, -08 = Mi, -09 = Do
function slotTimes(day: number, hour: number, minute: number) {
  const start = berlinWallClockToUtc(2030, 4, day, hour, minute);
  return { start, end: new Date(start.getTime() + SLOT_MINUTES * 60_000) };
}

async function createSlot(day: number, hour: number, minute: number) {
  const { start, end } = slotTimes(day, hour, minute);
  return prisma.consultationSlot.create({ data: { start, end } });
}

function bookingInput(slotId: string, email: string) {
  return {
    slotId,
    email,
    participants: 1,
    consultationType: "FULL_SITE_REVIEW" as const,
    description: "Testbuchung",
    zoomUrl: "https://zoom.us/j/test",
  };
}

async function cleanup() {
  const range = { gte: new Date("2030-01-01T00:00:00Z"), lt: new Date("2031-01-01T00:00:00Z") };
  // Buchungen zuerst: onDelete ist Restrict.
  await prisma.consultationBooking.deleteMany({ where: { slot: { start: range } } });
  await prisma.consultationSlot.deleteMany({ where: { start: range } });
  await prisma.callLead.deleteMany({ where: { retellCallId: { startsWith: PREFIX } } });
}

before(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Consultation-Policy", () => {
  const now = new Date("2026-07-14T12:00:00Z");

  test("akzeptiert einen regulären Slot", () => {
    const start = berlinWallClockToUtc(2026, 6, 17, 16, 30); // Fr, 17.07.2026
    const end = new Date(start.getTime() + 30 * 60_000);
    assert.equal(checkSlotPolicy(start, end, now), null);
  });

  test("lehnt Termine unter 24 h Vorlauf ab", () => {
    const tooSoon = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    assert.equal(checkSlotPolicy(tooSoon, new Date(tooSoon.getTime() + 30 * 60_000), now), "too_soon");

    // Gegenprobe: Mi, 15.07.2026 16:00 Berlin liegt 26 h nach dem Bezugszeitpunkt.
    const start = berlinWallClockToUtc(2026, 6, 15, 16, 0);
    assert.equal(checkSlotPolicy(start, new Date(start.getTime() + 30 * 60_000), now), null);
  });

  test("lehnt Wochenenden ab", () => {
    const start = berlinWallClockToUtc(2026, 6, 18, 16, 0); // Sa, 18.07.2026
    const end = new Date(start.getTime() + 30 * 60_000);
    assert.equal(checkSlotPolicy(start, end, now), "weekday_not_allowed");
  });

  test("lehnt Zeiten außerhalb von 16–20 Uhr ab", () => {
    const early = berlinWallClockToUtc(2026, 6, 17, 15, 30);
    const late = berlinWallClockToUtc(2026, 6, 17, 19, 30);
    assert.equal(checkSlotPolicy(early, new Date(early.getTime() + 30 * 60_000), now), "outside_hours");
    // 19:30–20:00 ist der letzte gültige Slot.
    assert.equal(checkSlotPolicy(late, new Date(late.getTime() + 30 * 60_000), now), null);
  });

  test("lehnt Termine außerhalb des Halbstunden-Rasters ab", () => {
    const start = berlinWallClockToUtc(2026, 6, 17, 16, 7);
    const end = new Date(start.getTime() + 30 * 60_000);
    assert.equal(checkSlotPolicy(start, end, now), "outside_hours");
  });

  test("lehnt abweichende Dauern ab", () => {
    const start = berlinWallClockToUtc(2026, 6, 17, 16, 0);
    const end = new Date(start.getTime() + 90 * 60_000);
    assert.equal(checkSlotPolicy(start, end, now), "invalid_duration");
  });

  test("lehnt Termine weiter als 14 Tage voraus ab", () => {
    const start = berlinWallClockToUtc(2026, 7, 3, 16, 0); // Mo, 03.08.2026 — 20 Tage
    const end = new Date(start.getTime() + 30 * 60_000);
    assert.equal(checkSlotPolicy(start, end, now), "too_far_ahead");
  });
});

describe("Consultation-Buchung", () => {
  test("bucht einen freien Slot", async () => {
    const slot = await createSlot(6, 18, 0); // Mo, 18:00
    const { booking } = await bookSlot(bookingInput(slot.id, "ok@example.com"), NOW_2030);

    assert.ok(booking.id);
    const stored = await prisma.consultationSlot.findUniqueOrThrow({ where: { id: slot.id } });
    assert.equal(stored.isBooked, true);
  });

  test("lehnt einen Slot ab, der den 24-h-Vorlauf reißt", async () => {
    const slot = await createSlot(6, 18, 30);
    // Bezugszeitpunkt eine Stunde vor dem Slot.
    const justBefore = new Date(slot.start.getTime() - 60 * 60 * 1000);

    await assert.rejects(
      () => bookSlot(bookingInput(slot.id, "toosoon@example.com"), justBefore),
      SlotUnavailableError,
    );

    const stored = await prisma.consultationSlot.findUniqueOrThrow({ where: { id: slot.id } });
    assert.equal(stored.isBooked, false);
  });

  test("lässt bei parallelen Anfragen auf denselben Slot nur eine Buchung durch", async () => {
    const slot = await createSlot(7, 18, 0); // Di, 18:00

    const results = await Promise.allSettled([
      bookSlot(bookingInput(slot.id, "race-a@example.com"), NOW_2030),
      bookSlot(bookingInput(slot.id, "race-b@example.com"), NOW_2030),
      bookSlot(bookingInput(slot.id, "race-c@example.com"), NOW_2030),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "genau eine Buchung darf durchgehen");
    assert.equal(rejected.length, 2);
    for (const r of rejected) {
      assert.ok((r as PromiseRejectedResult).reason instanceof SlotUnavailableError);
    }

    const bookings = await prisma.consultationBooking.count({ where: { slotId: slot.id } });
    assert.equal(bookings, 1, "in der DB darf nur eine Buchung liegen");
  });
});

describe("Kollision zwischen Web-Consultation und Telefonagent", () => {
  test("ein gebuchter Consultation-Slot blockiert den Telefonagenten", async () => {
    // 16:30–17:00 Berlin: liegt in beiden Fenstern (Consultation 16–20, Telefon 09–17).
    const slot = await createSlot(8, 16, 30); // Mi
    await bookSlot(bookingInput(slot.id, "web@example.com"), NOW_2030);

    const result = await calendarProvider.createBooking({
      name: "Max Mustermann",
      reason: "Telefontermin auf belegtem Slot",
      startDateTime: "2030-05-08T16:30:00+02:00",
      endDateTime: "2030-05-08T17:00:00+02:00",
      timezone: "Europe/Berlin",
      callId: `${PREFIX}-blocked`,
    });

    assert.equal(result.success, false);
    assert.equal(result.error, "slot_unavailable");
  });

  test("ein Telefontermin blockiert den überlappenden Consultation-Slot", async () => {
    const phone = await calendarProvider.createBooking({
      name: "Erika Muster",
      reason: "Telefontermin zuerst",
      startDateTime: "2030-05-09T16:30:00+02:00",
      endDateTime: "2030-05-09T17:00:00+02:00",
      timezone: "Europe/Berlin",
      callId: `${PREFIX}-phone-first`,
    });
    assert.equal(phone.success, true);

    const slot = await createSlot(9, 16, 30); // Do, dieselbe Zeit

    await assert.rejects(
      () => bookSlot(bookingInput(slot.id, "web-second@example.com"), NOW_2030),
      SlotUnavailableError,
    );

    const stored = await prisma.consultationSlot.findUniqueOrThrow({ where: { id: slot.id } });
    assert.equal(stored.isBooked, false);
  });

  test("der Telefonagent lehnt Termine unter 24 h Vorlauf ab", async () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const result = await calendarProvider.createBooking({
      name: "Kurzentschlossen",
      reason: "Sofort-Termin",
      startDateTime: inTwoHours.toISOString(),
      endDateTime: new Date(inTwoHours.getTime() + 30 * 60_000).toISOString(),
      timezone: "Europe/Berlin",
      callId: `${PREFIX}-too-soon`,
    });

    assert.equal(result.success, false);
    assert.equal(result.error, "too_soon");
  });
});
