import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { calendarProvider } from "../src/lib/retell/calendar";
import { buildDiscordLeadPayload } from "../src/lib/retell/discord";
import { upsertCallLead } from "../src/lib/retell/leads";
import { handleRetellWebhookEvent } from "../src/lib/retell/webhook";
import { verifyRetellSignature } from "../src/lib/retell/signature";

const PREFIX = `test-retell-${Date.now()}`;

function booking(callId: string, startDateTime: string, endDateTime: string) {
  return {
    name: "Max Mustermann",
    company: "Muster GmbH",
    phone: "+49123456789",
    reason: "Interessiert an neuer Website",
    projectType: "website" as const,
    startDateTime,
    endDateTime,
    timezone: "Europe/Berlin",
    callId,
  };
}

async function cleanup() {
  await prisma.callLead.deleteMany({
    where: { retellCallId: { startsWith: PREFIX } },
  });
}

before(async () => {
  process.env.DISCORD_WEBHOOK_URL = "";
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Retell appointment booking", () => {
  test("books a valid appointment", async () => {
    const result = await calendarProvider.createBooking(
      booking(`${PREFIX}-success`, "2030-05-06T10:00:00+02:00", "2030-05-06T10:30:00+02:00"),
    );

    assert.equal(result.success, true);
    assert.ok(result.eventId);

    const event = await prisma.calendarEvent.findUnique({ where: { id: result.eventId } });
    assert.equal(event?.timezone, "Europe/Berlin");
  });

  test("rejects appointments in the past", async () => {
    const result = await calendarProvider.createBooking(
      booking(`${PREFIX}-past`, "2020-05-06T10:00:00+02:00", "2020-05-06T10:30:00+02:00"),
    );

    assert.equal(result.success, false);
    assert.equal(result.error, "past");
  });

  test("rejects an occupied slot", async () => {
    const first = await calendarProvider.createBooking(
      booking(`${PREFIX}-occupied-a`, "2030-05-07T11:00:00+02:00", "2030-05-07T11:30:00+02:00"),
    );
    const second = await calendarProvider.createBooking(
      booking(`${PREFIX}-occupied-b`, "2030-05-07T11:00:00+02:00", "2030-05-07T11:30:00+02:00"),
    );

    assert.equal(first.success, true);
    assert.equal(second.success, false);
    assert.equal(second.error, "slot_unavailable");
  });
});

describe("Retell leads and notifications", () => {
  test("saves a lead without appointment", async () => {
    const lead = await upsertCallLead({
      callId: `${PREFIX}-lead`,
      name: "Erika Muster",
      company: "Muster AG",
      phone: "+4920212345",
      reason: "Allgemeine Beratung",
      projectType: "other",
      noAppointmentReason: "Anrufer wollte noch keinen Termin",
      callStatus: "lead_saved",
    });

    assert.equal(lead.appointmentBooked, false);
    assert.equal(lead.reason, "Allgemeine Beratung");
  });

  test("builds the Discord payload for a booked appointment", async () => {
    const result = await calendarProvider.createBooking(
      booking(`${PREFIX}-discord`, "2030-05-08T14:00:00+02:00", "2030-05-08T14:30:00+02:00"),
    );
    assert.equal(result.success, true);

    const lead = await prisma.callLead.findUniqueOrThrow({
      where: { id: result.leadId },
      include: { calendarEvents: true },
    });
    const payload = buildDiscordLeadPayload(lead);

    assert.equal(payload.embeds[0].title, "📞 Neuer Website-Termin gebucht");
    assert.ok(payload.embeds[0].fields.some((field) => field.name === "Retell Call ID"));
    assert.ok(payload.embeds[0].fields.some((field) => field.name === "Termin"));
  });

  test("processes a Retell webhook event idempotently", async () => {
    const call = {
      call_id: `${PREFIX}-webhook`,
      from_number: "+491721234567",
      call_status: "ended",
      transcript: "Anrufer interessiert sich für SEO, möchte aber keinen Termin.",
      call_analysis: {
        call_summary: "SEO-Anfrage ohne Termin.",
        custom_analysis_data: {
          name: "SEO Kunde",
          company: "SEO GmbH",
          project_type: "seo",
          appointment_requested: false,
          no_appointment_reason: "Möchte erst intern sprechen",
        },
      },
    };

    const first = await handleRetellWebhookEvent("call_analyzed", call);
    const second = await handleRetellWebhookEvent("call_analyzed", call);
    const lead = await prisma.callLead.findUniqueOrThrow({ where: { retellCallId: `${PREFIX}-webhook` } });

    assert.equal(first.leadId, second.leadId);
    assert.equal(lead.projectType, "seo");
    assert.equal(lead.summary, "SEO-Anfrage ohne Termin.");
  });

  test("validates Retell signatures", () => {
    const rawBody = JSON.stringify({ event: "call_ended", call: { call_id: `${PREFIX}-signed` } });
    const timestamp = Date.now().toString();
    const secret = "retell-test-secret";
    const digest = crypto.createHmac("sha256", secret).update(`${rawBody}${timestamp}`).digest("hex");

    assert.equal(verifyRetellSignature(rawBody, `v=${timestamp},d=${digest}`, secret), true);
    assert.equal(verifyRetellSignature(rawBody, `v=${timestamp},d=deadbeef`, secret), false);
  });
});
