import { NextRequest, NextResponse } from "next/server";
import { findSlotAlternatives, isSlotAvailable, validateBookingSlot } from "@/lib/retell/calendar";
import { verifyRetellSignature } from "@/lib/retell/signature";
import {
  addMinutes,
  checkAvailabilitySchema,
  DEFAULT_APPOINTMENT_MINUTES,
  parseDateTime,
  parseRetellToolBody,
} from "@/lib/retell/validation";
import { formatGermanDateTime, formatIsoInTimezone } from "@/lib/retell/time";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-retell-signature");

  if (!verifyRetellSignature(rawBody, signature)) {
    return NextResponse.json({ available: false, reason: "invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ available: false, reason: "invalid json" }, { status: 400 });
  }

  const parsed = checkAvailabilitySchema.safeParse(parseRetellToolBody(json));
  if (!parsed.success) {
    return NextResponse.json({ available: false, reason: "invalid payload" }, { status: 400 });
  }

  let start: Date;
  try {
    start = parseDateTime(parsed.data.startDateTime);
  } catch {
    return NextResponse.json({ available: false, reason: "invalid_datetime", alternatives: [] }, { status: 200 });
  }

  const endDateTime = parsed.data.endDateTime || addMinutes(start, DEFAULT_APPOINTMENT_MINUTES).toISOString();
  const slotInput = {
    name: "Verfügbarkeitsprüfung",
    reason: "Verfügbarkeitsprüfung",
    startDateTime: parsed.data.startDateTime,
    endDateTime,
    timezone: parsed.data.timezone,
  };
  const slot = validateBookingSlot(slotInput);

  if (!slot.ok) {
    return NextResponse.json({
      available: false,
      reason: slot.reason,
      alternatives: await findSlotAlternatives(start, parsed.data.timezone),
    });
  }

  if (!(await isSlotAvailable(slot.start, slot.end))) {
    return NextResponse.json({
      available: false,
      reason: "slot_unavailable",
      alternatives: await findSlotAlternatives(slot.start, slot.timezone),
    });
  }

  return NextResponse.json({
    available: true,
    startDateTime: formatIsoInTimezone(slot.start, slot.timezone),
    endDateTime: formatIsoInTimezone(slot.end, slot.timezone),
    timezone: slot.timezone,
    message: `Der Termin am ${formatGermanDateTime(slot.start, slot.timezone)} ist verfügbar.`,
  });
}
