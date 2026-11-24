import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { calendarProvider, findSlotAlternatives } from "../src/lib/retell/calendar";
import { buildDiscordLeadPayload } from "../src/lib/retell/discord";
import { extractLeadInputFromRetellCall, shouldNotifyCallLead, upsertCallLead } from "../src/lib/retell/leads";
import { handleRetellWebhookEvent } from "../src/lib/retell/webhook";
import { verifyRetellSignature } from "../src/lib/retell/signature";
import { parseRetellToolBody } from "../src/lib/retell/validation";
import { isBusinessSlot } from "../src/lib/retell/time";

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

describe("Telefonagent-Buchungsfenster Mo–Fr 08–18 Uhr", () => {
  const slot = (start: string, end: string) => isBusinessSlot(new Date(start), new Date(end), "Europe/Berlin");

  test("erster und letzter Slot liegen im Fenster (Sommer- und Winterzeit)", () => {
    assert.equal(slot("2030-05-06T08:00:00+02:00", "2030-05-06T08:30:00+02:00"), true);
    assert.equal(slot("2030-05-06T17:30:00+02:00", "2030-05-06T18:00:00+02:00"), true);
    assert.equal(slot("2030-01-07T08:00:00+01:00", "2030-01-07T08:30:00+01:00"), true);
    assert.equal(slot("2030-01-07T17:30:00+01:00", "2030-01-07T18:00:00+01:00"), true);
  });

  test("vor 08 Uhr, nach 18 Uhr und am Wochenende abgelehnt", () => {
    assert.equal(slot("2030-05-06T07:30:00+02:00", "2030-05-06T08:00:00+02:00"), false);
    assert.equal(slot("2030-05-06T17:45:00+02:00", "2030-05-06T18:15:00+02:00"), false);
    assert.equal(slot("2030-05-06T18:00:00+02:00", "2030-05-06T18:30:00+02:00"), false);
    assert.equal(slot("2030-05-11T10:00:00+02:00", "2030-05-11T10:30:00+02:00"), false);
    assert.equal(slot("2030-05-12T10:00:00+02:00", "2030-05-12T10:30:00+02:00"), false);
  });
});

describe("Terminvorschläge des Telefonagenten", () => {
  // Termine im Juni 2030: kein anderer Test belegt diese Tage.
  // 2030-06-03 = Mo, -05 = Mi, -07 = Fr, -10 = Mo, -12 = Mi
  const NOW = new Date("2030-05-01T09:00:00Z");
  const starts = async (preferred: string, now = NOW) =>
    (await findSlotAlternatives(new Date(preferred), "Europe/Berlin", 30, 3, now)).map((a) => a.startDateTime);

  test("vor Öffnung: ab 08:00 im Halbstundenraster", async () => {
    assert.deepEqual(await starts("2030-06-03T07:30:00+02:00"), [
      "2030-06-03T08:00:00+02:00",
      "2030-06-03T08:30:00+02:00",
      "2030-06-03T09:00:00+02:00",
    ]);
  });

  test("Freitagabend: weiter am Montag ab 08:00", async () => {
    assert.deepEqual(await starts("2030-06-07T17:30:00+02:00"), [
      "2030-06-10T08:00:00+02:00",
      "2030-06-10T08:30:00+02:00",
      "2030-06-10T09:00:00+02:00",
    ]);
  });

  test("Mindestvorlauf zu krummer Uhrzeit: erster Rasterpunkt danach", async () => {
    // Jetzt = Di 04.06. 10:05 Berlin, Mindestvorlauf endet Mi 05.06. 10:05.
    assert.deepEqual(await starts("2030-06-04T11:00:00+02:00", new Date("2030-06-04T08:05:00Z")), [
      "2030-06-05T10:30:00+02:00",
      "2030-06-05T11:00:00+02:00",
      "2030-06-05T11:30:00+02:00",
    ]);
  });

  test("belegter Termin wird übersprungen", async () => {
    const booked = await calendarProvider.createBooking(
      booking(`${PREFIX}-alternatives`, "2030-06-12T09:00:00+02:00", "2030-06-12T09:30:00+02:00"),
    );
    assert.equal(booked.success, true);

    assert.deepEqual(await starts("2030-06-12T08:30:00+02:00"), [
      "2030-06-12T09:30:00+02:00",
      "2030-06-12T10:00:00+02:00",
      "2030-06-12T10:30:00+02:00",
    ]);
  });
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

    assert.equal(payload.content, "@here");
    assert.deepEqual(payload.allowed_mentions, { parse: ["everyone"] });
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
          call_type: "new_interest",
          lead_quality: "high",
          service_interest: "seo",
          urgency: "normal",
          budget_mentioned: false,
          follow_up_required: true,
          caller_sentiment: "positive",
        },
      },
    };

    const first = await handleRetellWebhookEvent("call_analyzed", call);
    const second = await handleRetellWebhookEvent("call_analyzed", call);
    const lead = await prisma.callLead.findUniqueOrThrow({ where: { retellCallId: `${PREFIX}-webhook` } });

    assert.equal(first.leadId, second.leadId);
    assert.equal(lead.projectType, "seo");
    assert.equal(lead.summary, "SEO-Anfrage ohne Termin.");
    assert.equal(lead.callType, "new_interest");
    assert.equal(lead.leadQuality, "high");
    assert.equal(lead.budgetMentioned, false);
    assert.equal(lead.followUpRequired, true);
    assert.equal(lead.callerSentiment, "positive");
  });

  test("keeps booking state when the analyzed webhook has no booking fields", async () => {
    const callId = `${PREFIX}-booked-webhook`;
    const booked = await calendarProvider.createBooking(
      booking(callId, "2030-05-09T14:00:00+02:00", "2030-05-09T14:30:00+02:00"),
    );
    assert.equal(booked.success, true);

    await handleRetellWebhookEvent("call_analyzed", {
      call_id: callId,
      from_number: "+491721234567",
      call_status: "ended",
      call_analysis: { call_summary: "Termin wurde erfolgreich gebucht." },
    });

    const lead = await prisma.callLead.findUniqueOrThrow({ where: { retellCallId: callId } });
    assert.equal(lead.appointmentBooked, true);
    assert.ok(lead.appointmentDateTime);
  });

  test("uses the caller number from the Retell function call context", () => {
    const parsed = parseRetellToolBody({
      name: "save_lead",
      args: { reason: "Rückrufwunsch" },
      call: {
        call_id: `${PREFIX}-context`,
        from_number: "+491761234567",
        transcript: "Ich brauche einen Rückruf.",
      },
    }) as Record<string, unknown>;

    assert.equal(parsed.phone, "+491761234567");
    assert.equal(parsed.callId, `${PREFIX}-context`);
    assert.equal(parsed.transcript, "Ich brauche einen Rückruf.");
  });

  test("reads Retell's current dynamic variable field", () => {
    const lead = extractLeadInputFromRetellCall("call_analyzed", {
      call_id: `${PREFIX}-dynamic`,
      from_number: "+491761234567",
      retell_llm_dynamic_variables: {
        customer_name: "Dynamic Kunde",
        company_name: "Dynamic GmbH",
        project_type: "redesign",
      },
    });

    assert.equal(lead.name, "Dynamic Kunde");
    assert.equal(lead.company, "Dynamic GmbH");
    assert.equal(lead.projectType, "redesign");
    assert.equal(lead.phone, "+491761234567");
  });

  test("does not notify for explicitly non-relevant calls", () => {
    assert.equal(shouldNotifyCallLead({ callType: "wrong_number", followUpRequired: null }), false);
    assert.equal(shouldNotifyCallLead({ callType: "new_interest", followUpRequired: false }), false);
    assert.equal(shouldNotifyCallLead({ callType: "new_interest", followUpRequired: true }), true);
  });

  test("validates Retell signatures", () => {
    const rawBody = JSON.stringify({ event: "call_ended", call: { call_id: `${PREFIX}-signed` } });
    const timestamp = Date.now().toString();
    const secret = "retell-test-secret";
    const digest = crypto.createHmac("sha256", secret).update(`${rawBody}${timestamp}`).digest("hex");

    assert.equal(verifyRetellSignature(rawBody, `v=${timestamp},d=${digest}`, secret), true);
    assert.equal(verifyRetellSignature(rawBody, `v=${timestamp},d=deadbeef`, secret), false);
    assert.equal(verifyRetellSignature(rawBody, `v=${timestamp},d=${digest}`, ""), false);
  });
});
