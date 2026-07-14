// Redirect-Ziele aus ?next= duerfen nie auf fremde Origins zeigen.
// Erlaubt ist nur ein interner, absoluter Pfad wie "/checkout/landing_page?x=1".

const FALLBACK = "/dashboard";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

export function safeRelativePath(value: unknown, fallback: string = FALLBACK): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return fallback;
  // "//host" und "/\host" werden von Browsern als protokoll-relative URL gelesen.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\")) return fallback;
  if (CONTROL_CHARS.test(value)) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}
