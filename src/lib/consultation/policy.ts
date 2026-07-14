// Terminpolitik der Website-Consultation: Mo–Fr, 16–20 Uhr Berlin, 30-Minuten-Raster,
// mindestens 24 h Vorlauf. Einzige Quelle dieser Konstanten — API-Routen, UI, Retell
// und Tests importieren hier, damit die Regeln nicht wieder auseinanderlaufen.

export const TIMEZONE = "Europe/Berlin";
export const ALLOWED_WEEKDAYS = [1, 2, 3, 4, 5];
export const MAX_DAYS_AHEAD = 14; // Berliner Kalendertage ab heute
export const START_HOUR = 16;
export const END_HOUR = 20;
export const SLOT_MINUTES = 30;
export const LEAD_TIME_MS = 24 * 60 * 60 * 1000;

// Beide Buchungspfade (Web-Consultation und Retell-Telefonagent) nehmen diesen
// Advisory-Lock, bevor sie auf Kollisionen prüfen. Ohne ihn sind die Prüfungen
// zweier paralleler Transaktionen unabhängig und beide dürfen buchen.
export const BOOKING_LOCK_KEY = 815263741;

export type PolicyViolation =
  | "too_soon"
  | "too_far_ahead"
  | "weekday_not_allowed"
  | "outside_hours"
  | "invalid_duration";

type BerlinParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
};

// Wie viele ms ist Europe/Berlin der UTC zu diesem Zeitpunkt voraus (DST-aware).
export function berlinOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(date).map((part) => [part.type, part.value])
  );
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  return asUTC - date.getTime();
}

// UTC-Instant, dessen Berliner Wanduhr genau (Y-M-D, hour:minute) ist.
export function berlinWallClockToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const utcGuess = new Date(Date.UTC(year, monthIndex, day, hour, minute, 0));
  // 16:00/20:00 liegen nie auf einem DST-Sprung (der passiert nachts), daher reicht ein Schritt.
  return new Date(utcGuess.getTime() - berlinOffsetMs(utcGuess));
}

export function berlinParts(date: Date): BerlinParts {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
  };
}

function berlinWeekday(parts: BerlinParts): number {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

// Kalendertag als vergleichbare Zahl (YYYYMMDD).
function dayNumber(parts: BerlinParts): number {
  return parts.year * 10000 + parts.month * 100 + parts.day;
}

// Letzter Berliner Kalendertag, für den noch gebucht werden darf.
function latestAllowedDayNumber(now: Date): number {
  const today = berlinParts(now);
  const shifted = new Date(
    Date.UTC(today.year, today.month - 1, today.day + MAX_DAYS_AHEAD)
  );
  return (
    shifted.getUTCFullYear() * 10000 +
    (shifted.getUTCMonth() + 1) * 100 +
    shifted.getUTCDate()
  );
}

// Frühester Start, der den Mindestvorlauf einhält.
export function earliestBookableStart(now: Date = new Date()): Date {
  return new Date(now.getTime() + LEAD_TIME_MS);
}

// Prüft einen Zeitraum gegen die komplette Terminpolitik.
// Rückgabe: null = zulässig, sonst der erste verletzte Punkt.
export function checkSlotPolicy(
  start: Date,
  end: Date,
  now: Date = new Date()
): PolicyViolation | null {
  if (end.getTime() - start.getTime() !== SLOT_MINUTES * 60_000) {
    return "invalid_duration";
  }

  if (start.getTime() < earliestBookableStart(now).getTime()) {
    return "too_soon";
  }

  const startParts = berlinParts(start);
  const endParts = berlinParts(end);

  if (dayNumber(startParts) > latestAllowedDayNumber(now)) {
    return "too_far_ahead";
  }

  if (!ALLOWED_WEEKDAYS.includes(berlinWeekday(startParts))) {
    return "weekday_not_allowed";
  }

  // Ende muss auf denselben Berliner Kalendertag fallen wie der Start.
  if (dayNumber(startParts) !== dayNumber(endParts)) {
    return "outside_hours";
  }

  const startMinutes = startParts.hour * 60 + startParts.minute;
  const endMinutes = endParts.hour * 60 + endParts.minute;

  if (startMinutes < START_HOUR * 60 || endMinutes > END_HOUR * 60) {
    return "outside_hours";
  }

  // Nur volle Halbstunden (16:00, 16:30, …), kein 16:07.
  if (startParts.minute % SLOT_MINUTES !== 0) {
    return "outside_hours";
  }

  return null;
}
