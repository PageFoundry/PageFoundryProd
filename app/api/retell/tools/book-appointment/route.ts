import { NextRequest, NextResponse } from "next/server";
import { calendarProvider, findSlotAlternatives, isSlotAvailable, validateBookingSlot } from "@/lib/retell/calendar";
import { sendDiscordLeadNotification } from "@/lib/retell/discord";
import { verifyRetellSignature } from "@/lib/retell/signature";
import {
  addMinutes,
  bookAppointmentSchema,
  DEFAULT_APPOINTMENT_MINUTES,
  parseRetellToolBody,
} from "@/lib/retell/validation";
import { formatGermanDateTime } from "@/lib/retell/time";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-retell-signature");

  if (!verifyRetellSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = bookAppointmentSchema.safeParse(parseRetellToolBody(json));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "invalid payload" }, { status: 400 });
  }

  const start = new Date(parsed.data.startDateTime);
  const bookingInput = {
    ...parsed.data,
    endDateTime: parsed.data.endDateTime || addMinutes(start, DEFAULT_APPOINTMENT_MINUTES).toISOString(),
  };
  const slot = validateBookingSlot(bookingInput);

  if (!slot.ok) {
    const alternatives = Number.isNaN(start.getTime()) ? [] : await findSlotAlternatives(start, bookingInput.timezone);
    return NextResponse.json({ success: false, reason: slot.reason, alternatives }, { status: 200 });
  }

  if (!(await isSlotAvailable(slot.start, slot.end))) {
    return NextResponse.json(
      {
        success: false,
        reason: "slot_unavailable",
        alternatives: await findSlotAlternatives(slot.start, slot.timezone),
      },
      { status: 200 },
    );
  }

  const result = await calendarProvider.createBooking(bookingInput);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        reason: result.error || "booking_failed",
        alternatives: await findSlotAlternatives(slot.start, slot.timezone),
      },
      { status: 200 },
    );
  }

  if (result.leadId) {
    try {
      await sendDiscordLeadNotification(result.leadId);
    } catch (error) {
      console.error("Retell appointment Discord notification failed", error);
    }
  }

  return NextResponse.json({
    success: true,
    eventId: result.eventId,
    leadId: result.leadId,
    message: `Der Termin wurde erfolgreich für den ${formatGermanDateTime(slot.start, slot.timezone)} gebucht.`,
  });
}
