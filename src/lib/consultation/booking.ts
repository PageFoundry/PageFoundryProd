import { Prisma, type ConsultationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BOOKING_LOCK_KEY, checkSlotPolicy } from "./policy";

export class SlotUnavailableError extends Error {
  constructor() {
    super("Slot not available");
    this.name = "SlotUnavailableError";
  }
}

export type BookSlotInput = {
  slotId: string;
  email: string;
  participants: number;
  consultationType: ConsultationType;
  description: string;
  zoomUrl: string;
};

// Belegt einen Consultation-Slot und legt die Buchung an — beides in einer Transaktion.
// Wirft SlotUnavailableError, wenn der Slot nicht (mehr) buchbar ist.
export async function bookSlot(input: BookSlotInput, now: Date = new Date()) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Beide Buchungspfade — dieser hier und der Retell-Telefonagent — nehmen denselben
      // Lock, bevor sie auf Kollisionen prüfen. Ohne ihn laufen die Prüfungen zweier
      // paralleler Transaktionen unabhängig und beide dürfen buchen.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_KEY}::bigint)`;

      const slot = await tx.consultationSlot.findUnique({
        where: { id: input.slotId },
      });

      if (!slot || slot.isDisabled || slot.isBooked) {
        throw new SlotUnavailableError();
      }

      // Die Slot-ID allein ist kein Freifahrtschein: Vorlauf, Wochentag, Uhrzeitfenster,
      // Raster und Dauer werden hier erneut gegen die Policy geprüft.
      if (checkSlotPolicy(slot.start, slot.end, now) !== null) {
        throw new SlotUnavailableError();
      }

      const dayStart = new Date(
        Date.UTC(
          slot.start.getUTCFullYear(),
          slot.start.getUTCMonth(),
          slot.start.getUTCDate()
        )
      );
      const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayOff = await tx.consultationDayOff.findFirst({
        where: { date: { gte: dayStart, lt: nextDay } },
        select: { id: true },
      });
      if (dayOff) {
        throw new SlotUnavailableError();
      }

      // Der Telefonagent bucht in CalendarEvent (09–17 Uhr) — mit den Consultation-Slots
      // (16–20 Uhr) überschneidet sich das Fenster 16–17 Uhr.
      const phoneAppointment = await tx.calendarEvent.findFirst({
        where: {
          status: { not: "cancelled" },
          startDateTime: { lt: slot.end },
          endDateTime: { gt: slot.start },
        },
        select: { id: true },
      });
      if (phoneAppointment) {
        throw new SlotUnavailableError();
      }

      // Atomar belegen: greift nur, solange der Slot wirklich noch frei ist.
      const claimed = await tx.consultationSlot.updateMany({
        where: {
          id: slot.id,
          isBooked: false,
          isDisabled: false,
          OR: [
            { temporaryReservedUntil: null },
            { temporaryReservedUntil: { lte: now } },
          ],
        },
        data: { isBooked: true, temporaryReservedUntil: null },
      });

      if (claimed.count === 0) {
        throw new SlotUnavailableError();
      }

      const booking = await tx.consultationBooking.create({
        data: {
          slotId: slot.id,
          email: input.email,
          participants: input.participants,
          consultationType: input.consultationType,
          description: input.description,
          zoomUrl: input.zoomUrl,
        },
      });

      return { slot, booking };
    });
  } catch (err) {
    // P2002 = Unique-Verletzung auf ConsultationBooking.slotId: der Slot wurde parallel
    // gebucht. Für den Aufrufer dasselbe wie ein belegter Slot.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new SlotUnavailableError();
    }
    throw err;
  }
}
