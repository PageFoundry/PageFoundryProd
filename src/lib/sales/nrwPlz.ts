import data from "./nrw-plz.json";

// PLZ -> Ort fuer Nordrhein-Westfalen. Quelle und Abrufdatum stehen in nrw-plz.json.
// Achtung: Leadfinder kennt nur die Scan-PLZ, nicht den Firmensitz. Die Zuordnung ist
// deshalb eine Naeherung; zusaetzlich wird eine deutsche Telefonnummer verlangt.

const PLZ: Record<string, string> = (data as { plz: Record<string, string> }).plz;

export const NRW_PLZ_LIST: string[] = Object.keys(PLZ).sort();

export function isNrwPlz(plz: string | null | undefined): boolean {
  return Boolean(plz && Object.prototype.hasOwnProperty.call(PLZ, plz));
}

export function nrwCity(plz: string | null | undefined): string | null {
  return plz && isNrwPlz(plz) ? PLZ[plz] : null;
}
