import Database from "better-sqlite3";

// Firmen, die die Anrufliste NICHT bekommen darf, aus der outreach-demo-SQLite
// (Pfad OUTREACH_DB_PATH, echte DB: /home/ubuntu/outreach-demo/data/outreach.db).
// Strikt read-only: kein openDb()-Helfer aus outreach-demo (der legt Verzeichnisse an
// und oeffnet schreibend), keine PRAGMA-Umschaltungen ausser query_only.
//
// Ausgeschlossen (Fabian 2026-11-01):
//  - tatsaechlich angeschrieben / Reaktion: status contacted, replied, opt_out, bounced
//  - opt_out = 1 oder bounced = 1
//  - harte Bedenken aus dem Gate: hard_concern:legal_risk, :no_contact_permission,
//    :wrong_company, :chain_or_enterprise
// Fehler (Datei fehlt, busy, Schema) -> Exception. Aufrufer behandelt das fail-closed.

export type OutreachExclusions = {
  leadfinderIds: Set<string>;
  domains: Set<string>;
  emails: Set<string>;
};

const SQL = `
SELECT l.leadfinder_id AS lf, c.normalized_domain AS domain, c.normalized_email AS email
FROM outreach_contacts c
JOIN leads l ON l.id = c.lead_id
WHERE c.status IN ('contacted', 'replied', 'opt_out', 'bounced')
   OR c.opt_out = 1
   OR c.bounced = 1
   OR c.suppression_reason IN (
        'hard_concern:legal_risk',
        'hard_concern:no_contact_permission',
        'hard_concern:wrong_company',
        'hard_concern:chain_or_enterprise'
      )
`;

export function loadOutreachExclusions(dbPath = process.env.OUTREACH_DB_PATH): OutreachExclusions {
  if (!dbPath) throw new Error("OUTREACH_DB_PATH fehlt");
  const db = new Database(dbPath, { readonly: true, fileMustExist: true, timeout: 5_000 });
  try {
    db.pragma("query_only = ON");
    const rows = db.prepare(SQL).all() as Array<{ lf: string | null; domain: string | null; email: string | null }>;
    const out: OutreachExclusions = { leadfinderIds: new Set(), domains: new Set(), emails: new Set() };
    for (const r of rows) {
      if (r.lf) out.leadfinderIds.add(r.lf);
      if (r.domain) out.domains.add(r.domain);
      if (r.email) out.emails.add(r.email);
    }
    return out;
  } finally {
    db.close();
  }
}

// Gleiche Normalisierung wie outreach-demo/src/dedup.mjs (nur fuer den Abgleich mit
// deren Schluesseln; die eigene Sales-Normalisierung bleibt unveraendert).
export function outreachDomainKey(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  return s && s.includes(".") ? s : null;
}

export function outreachEmailKey(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  if (!s.includes("@")) return null;
  const [localRaw, domainRaw] = s.split("@");
  if (!localRaw || !domainRaw) return null;
  const local = localRaw.split("+")[0].replace(/\./g, "");
  const domain = outreachDomainKey(domainRaw);
  return domain ? `${local}@${domain}` : null;
}

export function isOutreachExcluded(
  ex: OutreachExclusions,
  c: { leadfinderId?: string | null; website?: string | null; email?: string | null }
): boolean {
  if (c.leadfinderId && ex.leadfinderIds.has(c.leadfinderId)) return true;
  const d = outreachDomainKey(c.website);
  if (d && ex.domains.has(d)) return true;
  const e = outreachEmailKey(c.email);
  if (e && ex.emails.has(e)) return true;
  return false;
}
