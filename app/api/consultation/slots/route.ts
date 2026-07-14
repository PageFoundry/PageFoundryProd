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
  berlinWallClockToUtc,
} from "@/lib/consultation/policy";

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
async function ensureSlotsForDate(day: Date, now: Date) {
  const dayStart = startOfDay(day);
  const nextDay = addDays(dayStart, 1);

  if (!isAllowedWeekday(dayStart)) return;

  // Slot-Zeiten in Europe/Berlin erzeugen, unabhängig von der Server-Zeitzone (UTC).
  const y = dayStart.getFullYear();
  const m = dayStart.getMonth();
  const d = dayStart.getDate();

  const slotStart = berlinWallClockToUtc(y, m, d, START_HOUR, 0);
  const slotEndLimit = berlinWallClockToUtc(y, m, d, END_HOUR, 0);

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

    const day = new Date(dateStr + "T00:00:00");
    if (Number.isNaN(day.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = startOfDay(now);
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
    await ensureSlotsForDate(day, now);

    const dayStart = startOfDay(day);
    const nextDay = addDays(dayStart, 1);

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
