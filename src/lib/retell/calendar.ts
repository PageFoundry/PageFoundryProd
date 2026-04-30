import { Prisma, type RetellProjectType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CalendarBookingRequest, CalendarBookingResult, CalendarProvider, SlotAlternative } from "./types";
import { addMinutes, DEFAULT_APPOINTMENT_MINUTES, DEFAULT_TIMEZONE, parseDateTime } from "./validation";
import { formatIsoInTimezone, isBusinessSlot } from "./time";

export type SlotValidationResult =
  | { ok: true; start: Date; end: Date; timezone: string }
  | { ok: false; reason: "invalid_datetime" | "past" | "invalid_duration" | "outside_business_hours" };

export function normalizeBookingInput(input: CalendarBookingRequest) {
  const timezone = input.timezone || DEFAULT_TIMEZONE;
  const start = parseDateTime(input.startDateTime);
  const end = parseDateTime(input.endDateTime);

  return { start, end, timezone };
}

export function validateBookingSlot(input: CalendarBookingRequest, now = new Date()): SlotValidationResult {
  let start: Date;
  let end: Date;
  let timezone: string;

  try {
    ({ start, end, timezone } = normalizeBookingInput(input));
  } catch {
    return { ok: false, reason: "invalid_datetime" };
  }

  if (start.getTime() <= now.getTime()) {
    return { ok: false, reason: "past" };
  }

  const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
  if (durationMinutes <= 0 || durationMinutes > 120) {
    return { ok: false, reason: "invalid_duration" };
  }

  if (!isBusinessSlot(start, end, timezone)) {
    return { ok: false, reason: "outside_business_hours" };
  }

  return { ok: true, start, end, timezone };
}

export async function isSlotAvailable(start: Date, end: Date) {
  const existing = await prisma.calendarEvent.findFirst({
    where: {
      status: { not: "cancelled" },
      startDateTime: { lt: end },
      endDateTime: { gt: start },
    },
    select: { id: true },
  });

  return !existing;
}

export async function findSlotAlternatives(
  preferredStart: Date,
  timezone = DEFAULT_TIMEZONE,
  durationMinutes = DEFAULT_APPOINTMENT_MINUTES,
  limit = 3,
): Promise<SlotAlternative[]> {
  const alternatives: SlotAlternative[] = [];
  let cursor = addMinutes(preferredStart, 30);

  for (let attempts = 0; attempts < 240 && alternatives.length < limit; attempts += 1) {
    const minutes = cursor.getUTCMinutes();
    const roundedMinutes = minutes <= 30 ? 30 : 60;
    cursor = new Date(cursor);
    cursor.setUTCMinutes(roundedMinutes === 60 ? 0 : 30, 0, 0);
    if (roundedMinutes === 60) {
      cursor.setUTCHours(cursor.getUTCHours() + 1);
    }

    const end = addMinutes(cursor, durationMinutes);
    if (cursor.getTime() > Date.now() && isBusinessSlot(cursor, end, timezone) && (await isSlotAvailable(cursor, end))) {
      alternatives.push({
        startDateTime: formatIsoInTimezone(cursor),
        endDateTime: formatIsoInTimezone(end),
      });
    }

    cursor = addMinutes(cursor, 30);
  }

  return alternatives;
}

function titleFor(input: CalendarBookingRequest) {
  const company = input.company ? ` (${input.company})` : "";
  return `Website-Beratung: ${input.name}${company}`;
}

function descriptionFor(input: CalendarBookingRequest) {
  const lines = [
    `Name: ${input.name}`,
    input.company ? `Firma: ${input.company}` : null,
    input.phone ? `Telefon: ${input.phone}` : null,
    `Grund: ${input.reason}`,
    input.projectType ? `Projekttyp: ${input.projectType}` : null,
    input.callId ? `Retell Call ID: ${input.callId}` : null,
    input.transcript ? `Transkript:\n${input.transcript}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

export class InternalCalendarProvider implements CalendarProvider {
  async createBooking(input: CalendarBookingRequest): Promise<CalendarBookingResult> {
    const slot = validateBookingSlot(input);
    if (!slot.ok) {
      return { success: false, error: slot.reason };
    }

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const existingLead = input.callId
            ? await tx.callLead.findUnique({
                where: { retellCallId: input.callId },
                include: { calendarEvents: { where: { status: { not: "cancelled" } }, take: 1 } },
              })
            : null;

          if (
            existingLead?.appointmentBooked &&
            existingLead.appointmentDateTime?.getTime() === slot.start.getTime() &&
            existingLead.calendarEvents[0]
          ) {
            return { eventId: existingLead.calendarEvents[0].id, leadId: existingLead.id };
          }

          const overlapping = await tx.calendarEvent.findFirst({
            where: {
              status: { not: "cancelled" },
              startDateTime: { lt: slot.end },
              endDateTime: { gt: slot.start },
            },
            select: { id: true },
          });

          if (overlapping) {
            throw new Error("slot_unavailable");
          }

          const leadData = {
            name: input.name,
            company: input.company || null,
            phone: input.phone || null,
            reason: input.reason,
            projectType: (input.projectType || null) as RetellProjectType | null,
            appointmentRequested: true,
            appointmentBooked: true,
            appointmentDateTime: slot.start,
            transcript: input.transcript || null,
            callStatus: "appointment_booked",
          };

          const lead = input.callId
            ? await tx.callLead.upsert({
                where: { retellCallId: input.callId },
                create: { ...leadData, retellCallId: input.callId },
                update: leadData,
              })
            : await tx.callLead.create({ data: leadData });

          const event = await tx.calendarEvent.create({
            data: {
              leadId: lead.id,
              title: titleFor(input),
              description: descriptionFor(input),
              startDateTime: slot.start,
              endDateTime: slot.end,
              timezone: slot.timezone,
              status: "booked",
            },
          });

          return { eventId: event.id, leadId: lead.id };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return { success: true, ...result };
    } catch (error) {
      if (error instanceof Error && error.message === "slot_unavailable") {
        return { success: false, error: "slot_unavailable" };
      }

      console.error("Retell calendar booking failed", error);
      return { success: false, error: "calendar_booking_failed" };
    }
  }
}

export const calendarProvider = new InternalCalendarProvider();
