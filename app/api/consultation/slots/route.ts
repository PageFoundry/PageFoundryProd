import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_WEEKDAYS,
  earliestBookableStart,
  END_HOUR,
  MAX_DAYS_AHEAD,
  SLOT_MINUTES,
  START_HOUR,
  TIMEZONE,
  berlinParts,
  berlinWallClockToUtc,
} from "@/lib/consultation/policy";

type BerlinDate = { year: number; monthIndex: number; day: number; weekday: number };

function parseBerlinDate(value: string): BerlinDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const normalized = new Date(Date.UTC(year, monthIndex, day));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== monthIndex ||
    normalized.getUTCDate() !== day
  ) return null;
  return { year, monthIndex, day, weekday: normalized.getUTCDay() };
}

function dayNumber(year: number, monthIndex: number, day: number): number {
  return year * 10000 + (monthIndex + 1) * 100 + day;
}

function addBerlinDays(date: BerlinDate, days: number): BerlinDate {
  const shifted = new Date(Date.UTC(date.year, date.monthIndex, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

// Slots für ein gegebenes Datum erzeugen, falls noch nicht vorhanden
async function ensureSlotsForDate(day: BerlinDate, now: Date) {
  if (!ALLOWED_WEEKDAYS.includes(day.weekday)) return;

  const next = addBerlinDays(day, 1);
  const dayStart = berlinWallClockToUtc(day.year, day.monthIndex, day.day, 0, 0);
  const nextDay = berlinWallClockToUtc(next.year, next.monthIndex, next.day, 0, 0);

  // Slot-Zeiten in Europe/Berlin erzeugen, unabhängig von der Server-Zeitzone (UTC).
  const slotStart = berlinWallClockToUtc(day.year, day.monthIndex, day.day, START_HOUR, 0);
  const slotEndLimit = berlinWallClockToUtc(day.year, day.monthIndex, day.day, END_HOUR, 0);

  // Wenn selbst der letzte Slot des Tages den Mindestvorlauf reißt, ist der ganze
  // Tag unbuchbar — dann gar nicht erst anlegen, sonst sammelt sich toter Bestand an.
  const lastSlotStart = new Date(slotEndLimit.getTime() - SLOT_MINUTES * 60_000);
  if (lastSlotStart < earliestBookableStart(now)) return;

  const existing = await prisma.consultationSlot.count({
    where: {
      start: {
        gte: dayStart,
        lt: nextDay,
      },
    },
  });
  if (existing > 0) return;

  // Prüfen, ob der Tag komplett gesperrt ist
  const dayOff = await prisma.consultationDayOff.findFirst({
    where: {
      date: {
        gte: dayStart,
        lt: nextDay,
      },
    },
  });
  if (dayOff) return;

  const slotsData: {
    start: Date;
    end: Date;
    isDisabled: boolean;
    isBooked: boolean;
  }[] = [];

  let current = slotStart;
  while (current < slotEndLimit) {
    const end = new Date(current.getTime() + SLOT_MINUTES * 60_000);

    slotsData.push({
      start: new Date(current),
      end,
      isDisabled: false,
      isBooked: false,
    });

    current = end;
  }

  if (slotsData.length > 0) {
    // skipDuplicates + @@unique([start]): zwei parallele GETs auf denselben Tag
    // erzeugen keine doppelten Slots mehr.
    await prisma.consultationSlot.createMany({
      data: slotsData,
      skipDuplicates: true,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!dateStr) {
      return NextResponse.json(
        { error: "Missing date parameter (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const day = parseBerlinDate(dateStr);
    if (!day) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayParts = berlinParts(now);
    const today: BerlinDate = {
      year: todayParts.year,
      monthIndex: todayParts.month - 1,
      day: todayParts.day,
      weekday: new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day)).getUTCDay(),
    };
    const upper = addBerlinDays(today, MAX_DAYS_AHEAD);

    const requestedDay = dayNumber(day.year, day.monthIndex, day.day);
    if (
      requestedDay < dayNumber(today.year, today.monthIndex, today.day) ||
      requestedDay > dayNumber(upper.year, upper.monthIndex, upper.day)
    ) {
      return NextResponse.json(
        { slots: [], message: "Date out of allowed range" },
        { status: 200 }
      );
    }

    // Nur erlaubte Wochentage
    if (!ALLOWED_WEEKDAYS.includes(day.weekday)) {
      return NextResponse.json(
        { slots: [], message: "No consultations on this weekday" },
        { status: 200 }
      );
    }

    // ggf. für diesen Tag Slots erzeugen
    await ensureSlotsForDate(day, now);

    const next = addBerlinDays(day, 1);
    const dayStart = berlinWallClockToUtc(day.year, day.monthIndex, day.day, 0, 0);
    const nextDay = berlinWallClockToUtc(next.year, next.monthIndex, next.day, 0, 0);

    // freie Slots liefern — frühestens nach Ablauf des Mindestvorlaufs
    const earliestStart = earliestBookableStart(now);
    const lowerBound = dayStart > earliestStart ? dayStart : earliestStart;

    const slots = await prisma.consultationSlot.findMany({
      where: {
        start: { gte: lowerBound, lt: nextDay },
        isDisabled: false,
        isBooked: false,
        OR: [
          { temporaryReservedUntil: null },
          { temporaryReservedUntil: { lte: now } },
        ],
      },
      orderBy: { start: "asc" },
    });

    const timeFormatter = new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIMEZONE,
    });

    const payload = slots.map((s) => {
      const startLabel = timeFormatter.format(s.start);
      const endLabel = timeFormatter.format(s.end);
      return {
        id: s.id,
        start: s.start,
        end: s.end,
        label: `${startLabel}–${endLabel} (${TIMEZONE})`,
      };
    });

    return NextResponse.json({ slots: payload }, { status: 200 });
  } catch (err) {
    console.error("consultation/slots error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
