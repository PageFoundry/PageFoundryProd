import { DEFAULT_TIMEZONE } from "./validation";

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getLocalParts(date: Date, timezone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
  };
}

export function isBusinessSlot(start: Date, end: Date, timezone = DEFAULT_TIMEZONE) {
  const startParts = getLocalParts(start, timezone);
  const endParts = getLocalParts(end, timezone);
  const day = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day)).getUTCDay();
  const sameLocalDay =
    startParts.year === endParts.year && startParts.month === endParts.month && startParts.day === endParts.day;

  if (!sameLocalDay || day === 0 || day === 6) {
    return false;
  }

  const startMinutes = startParts.hour * 60 + startParts.minute;
  const endMinutes = endParts.hour * 60 + endParts.minute;

  return startMinutes >= 9 * 60 && endMinutes <= 17 * 60 && endMinutes > startMinutes;
}

export function formatGermanDateTime(date: Date, timezone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: timezone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatIsoInTimezone(date: Date, timezone = DEFAULT_TIMEZONE) {
  const parts = getLocalParts(date, timezone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, date.getUTCSeconds());
  const offsetMinutes = Math.round((localAsUtc - date.getTime()) / 60_000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetRemainder = absoluteOffset % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(date.getUTCSeconds())}${sign}${pad(offsetHours)}:${pad(offsetRemainder)}`;
}
