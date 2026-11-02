import { Pool } from "pg";
import { NRW_PLZ_LIST } from "./nrwPlz";
import type { LfCandidate } from "./ranking";

// Read-only Zugriff auf die Leadfinder-DB (eigene Postgres-DB "leadfinder").
// Die Rolle hinter LEADFINDER_DATABASE_URL hat nur SELECT auf Company/Scan/ScoreReason.
// Leadfinder-App und -Crons sind seit 2026-07-07 pausiert; die Daten sind statisch.

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.LEADFINDER_DATABASE_URL;
  if (!url) throw new Error("LEADFINDER_DATABASE_URL fehlt");
  pool = new Pool({ connectionString: url, max: 2, statement_timeout: 10_000, idleTimeoutMillis: 30_000 });
  pool.on("error", (err) => console.error("[sales/leadfinder] pool error", err.message));
  return pool;
}

// Vorauswahl in SQL, Feinfilter + Ranking in ranking.ts.
//  - "businessStatus" IS DISTINCT FROM 'closed' (NULL = offen; 99,7 % sind NULL)
//  - Reasons per LEFT JOIN, damit ungescorte Firmen ohne Reasons nicht verloren gehen
//  - Telefon: +49/0049 immer; nationale 0-Nummern nur mit Koordinaten in der NRW-Box
//    (im Bestand stecken franzoesische Betriebe mit gleicher PLZ und 0-Nummern)
//  - Mehrfach vorkommende Nummer zaehlt ueber den GESAMTEN Bestand (Ketten-Indikator)
const CANDIDATE_SQL = `
WITH rk AS MATERIALIZED (
  SELECT "companyId" AS id, array_agg(key) AS keys
  FROM "ScoreReason" WHERE key NOT LIKE 'tech\\_%'
  GROUP BY 1
), ph AS MATERIALIZED (
  -- Dubletten per Window-Funktion (ein Durchlauf). Ein Join gegen ein GROUP BY liess
  -- den Planer auf echten Daten einen Nested Loop waehlen (> 60 s).
  SELECT id, raw, pn, count(*) OVER (PARTITION BY pn)::int AS cnt
  FROM (
    SELECT id,
           regexp_replace(phone, '[^0-9+]', '', 'g') AS raw,
           regexp_replace(regexp_replace(phone, '[^0-9+]', '', 'g'), '^(\\+49|0049)', '0') AS pn
    FROM "Company" WHERE phone IS NOT NULL AND phone <> ''
  ) x
)
SELECT c.id, c.name, c.website, c.email, c.phone, s.plz, s."createdAt" AS scan_at,
       c."salesProblemScore" AS sp, COALESCE(rk.keys, '{}') AS keys, ph.cnt AS dup_cnt
FROM ph
JOIN "Company" c ON c.id = ph.id
JOIN "Scan" s ON s.id = c."scanId"
LEFT JOIN rk ON rk.id = c.id
WHERE c."businessStatus" IS DISTINCT FROM 'closed'
  AND s.plz = ANY($1::text[])
  AND (ph.raw ~ '^(\\+49|0049)' OR (ph.raw ~ '^0[1-9]' AND c.lat BETWEEN 50.3 AND 52.6 AND c.lng BETWEEN 5.85 AND 9.47))
  AND NOT ('website_mismatch' = ANY(COALESCE(rk.keys, '{}')))
  AND (c.website IS NULL
       OR 'website_unreachable' = ANY(COALESCE(rk.keys, '{}'))
       OR COALESCE(c."salesProblemScore", 0) >= 40)
  AND NOT (c.id = ANY($2::text[]))
  AND (CASE
         WHEN c.website IS NOT NULL AND 'website_unreachable' = ANY(COALESCE(rk.keys, '{}')) THEN 'A'
         WHEN c.website IS NOT NULL THEN 'B'
         ELSE 'C'
       END) = $5
ORDER BY md5($3 || c.id)
LIMIT $4
`;

type Row = {
  id: string; name: string; website: string | null; email: string | null; phone: string | null;
  plz: string | null; scan_at: Date | null; sp: number | null; keys: string[]; dup_cnt: number;
};

/**
 * Laedt Kandidaten einer Vor-Stufe (A = gespeicherte Website als unerreichbar markiert,
 * B = Website mit Bedarf >= 40, C = keine Website). Reihenfolge: stabiler Tageszufall.
 * excludeIds: bereits vergebene/gesperrte Leadfinder-IDs.
 */
export async function fetchLeadfinderCandidates(opts: { excludeIds: string[]; day: string; limit: number; tier: "A" | "B" | "C" }): Promise<LfCandidate[]> {
  const res = await getPool().query<Row>(CANDIDATE_SQL, [NRW_PLZ_LIST, opts.excludeIds, opts.day, opts.limit, opts.tier]);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    website: r.website,
    email: r.email,
    phone: r.phone,
    plz: r.plz,
    scanAt: r.scan_at,
    salesProblemScore: r.sp,
    reasonKeys: r.keys,
    phoneDupCount: r.dup_cnt,
  }));
}

export async function closeLeadfinderPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
