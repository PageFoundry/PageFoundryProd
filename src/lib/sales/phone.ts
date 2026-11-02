// Telefonnummern fuer Lead-Schutz und Anrufliste. Reine Funktionen, unit-testbar.
//
// Ziel ist E.164 fuer deutsche Nummern (+49...). Nationale Nummern (0...) werden nur
// mit ausdruecklichem DE-Kontext umgerechnet: bei Leadfinder-Daten nur, wenn der
// Standort per PLZ in NRW liegt; bei manueller Eingabe im Sales-Portal (deutscher
// Vertrieb, deutsches Formular) ebenfalls.

const SEPARATORS = /[\s\-\/().]/g;

/**
 * Zerlegt ein Feld mit evtl. mehreren Nummern ("0211 123; 0172 456") in Teile.
 * Kein blindes Entfernen aller Zeichen, damit zwei Nummern nicht zu einer verkleben.
 */
export function splitPhoneField(raw: string | null | undefined): string[] {
  return String(raw || "")
    .split(/[;,|]|\s{2,}|\s+(?:oder|od\.|u\.|und)\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Normalisiert EINE Nummer zu E.164 (+49...). Gibt null zurueck, wenn die Nummer
 * nicht eindeutig deutsch und plausibel ist. Durchwahlen ("-12") gehoeren zur Nummer
 * und bleiben erhalten, solange die Laenge plausibel ist.
 */
export function normalizePhoneDE(raw: string | null | undefined, opts: { assumeDE: boolean }): string | null {
  let s = String(raw || "").trim();
  if (!s) return null;
  // "+49 (0) 211 ..." -> "+49 211 ..."
  s = s.replace(/^\+\s*49\s*\(\s*0\s*\)/, "+49");
  s = s.replace(/^0049\s*\(\s*0\s*\)/, "+49");
  if (/[a-z]/i.test(s.replace(/\b(tel|fon|phone|telefon)\.?:?/gi, ""))) return null;
  s = s.replace(/\b(tel|fon|phone|telefon)\.?:?/gi, "").replace(SEPARATORS, "");
  if (!/^\+?\d+$/.test(s)) return null;

  let national: string;
  if (s.startsWith("+49")) national = s.slice(3);
  else if (s.startsWith("0049")) national = s.slice(4);
  else if (s.startsWith("+") || s.startsWith("00")) return null; // Ausland
  else if (s.startsWith("0")) {
    if (!opts.assumeDE) return null;
    national = s.slice(1);
  } else return null; // ohne Vorwahl nicht eindeutig

  national = national.replace(/^0+/, "");
  // Deutsche Rufnummern ohne 0: 6–13 Ziffern (inkl. Durchwahl).
  if (!/^[1-9]\d{5,12}$/.test(national)) return null;
  return `+49${national}`;
}

/** Erste gueltige Nummer aus einem Feld (oder null). */
export function firstValidPhoneDE(raw: string | null | undefined, opts: { assumeDE: boolean }): string | null {
  for (const part of splitPhoneField(raw)) {
    const n = normalizePhoneDE(part, opts);
    if (n) return n;
  }
  return null;
}

/** Deutsche Mobilnummer (015x/016x/017x). */
export function isMobileDE(e164: string): boolean {
  return /^\+491[5-7]/.test(e164);
}

/** Lesbare Darstellung fuer das UI: +49 211 1234567 */
export function formatPhoneDE(e164: string): string {
  if (!e164.startsWith("+49")) return e164;
  const n = e164.slice(3);
  if (isMobileDE(e164)) return `+49 ${n.slice(0, 3)} ${n.slice(3)}`;
  return `+49 ${n.slice(0, n.length > 9 ? 4 : 3)} ${n.slice(n.length > 9 ? 4 : 3)}`;
}
