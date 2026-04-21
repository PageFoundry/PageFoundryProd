import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_DAYS_AHEAD = 14;
const SLOT_MINUTES = 30;
const START_HOUR = 15;
const END_HOUR = 20;
const TIMEZONE = "Europe/Berlin";

// Mo = 1, Mi = 3, Do = 4
const ALLOWED_WEEKDAYS = [1, 3, 4];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isAllowedWeekday(date: Date) {
  const dow = date.getDay();
  return ALLOWED_WEEKDAYS.includes(dow);
}

// Slots für ein gegebenes Datum erzeugen, falls noch nicht vorhanden
async function ensureSlotsForDate(day: Date) {
  const dayStart = startOfDay(day);
  const nextDay = addDays(dayStart, 1);

  if (!isAllowedWeekday(dayStart)) return;

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

  const slotStart = new Date(dayStart);
  slotStart.setHours(START_HOUR, 0, 0, 0);

  const slotEndLimit = new Date(dayStart);
  slotEndLimit.setHours(END_HOUR, 0, 0, 0);

  let current = slotStart;
  while (current < slotEndLimit) {
    const end = new Date(current);
    end.setMinutes(end.getMinutes() + SLOT_MINUTES);

    slotsData.push({
      start: new Date(current),
      end,
      isDisabled: false,
      isBooked: false,
    });

    current = end;
  }

  if (slotsData.length > 0) {
    await prisma.consultationSlot.createMany({
      data: slotsData,
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

    const day = new Date(dateStr + "T00:00:00");
    if (Number.isNaN(day.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const today = startOfDay(new Date());
    const upper = addDays(today, MAX_DAYS_AHEAD);

    if (day < today || day > upper) {
      return NextResponse.json(
        { slots: [], message: "Date out of allowed range" },
        { status: 200 }
      );
    }

    // Nur erlaubte Wochentage
    if (!isAllowedWeekday(day)) {
      return NextResponse.json(
        { slots: [], message: "No consultations on this weekday" },
        { status: 200 }
      );
    }

    // ggf. für diesen Tag Slots erzeugen
    await ensureSlotsForDate(day);

    const dayStart = startOfDay(day);
    const nextDay = addDays(dayStart, 1);

    // freie Slots liefern
    const now = new Date();
    const slots = await prisma.consultationSlot.findMany({
      where: {
        start: { gte: dayStart, lt: nextDay },
        isDisabled: false,
        isBooked: false,
        OR: [
          { temporaryReservedUntil: null },
          { temporaryReservedUntil: { lt: now } },
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
