// Baut die Test-Fixtures fuer die Anrufliste neu auf (nur Test-Ziele, sonst Abbruch).
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import Database from "better-sqlite3";

const lfUrl = process.env.LEADFINDER_DATABASE_URL || "";
const odPath = process.env.OUTREACH_DB_PATH || "";
if (new URL(lfUrl).pathname !== "/leadfinder_test") throw new Error(`LEADFINDER_DATABASE_URL muss auf leadfinder_test zeigen (ist ${new URL(lfUrl).pathname})`);
if (!odPath.includes("/tests/fixtures/")) throw new Error(`OUTREACH_DB_PATH muss eine Test-Fixture sein (ist ${odPath})`);

const here = path.dirname(new URL(import.meta.url).pathname);
const client = new pg.Client({ connectionString: lfUrl });
await client.connect();
await client.query(readFileSync(path.join(here, "leadfinder-fixture.sql"), "utf8"));
await client.end();

rmSync(odPath, { force: true });
const db = new Database(odPath);
db.exec(`
  CREATE TABLE leads (id TEXT PRIMARY KEY, leadfinder_id TEXT NOT NULL UNIQUE);
  CREATE TABLE outreach_contacts (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id), normalized_domain TEXT, normalized_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending', opt_out INTEGER NOT NULL DEFAULT 0, bounced INTEGER NOT NULL DEFAULT 0, suppression_reason TEXT);
  INSERT INTO leads VALUES ('L1','lfXO'), ('L2','lfXL'), ('L3','lfB2');
  INSERT INTO outreach_contacts (id, lead_id, normalized_domain, normalized_email, status) VALUES ('C1','L1','outreach-mailed.example','info@outreach-mailed.example','contacted');
  INSERT INTO outreach_contacts (id, lead_id, status, suppression_reason) VALUES ('C2','L2','suppressed','hard_concern:legal_risk');
  INSERT INTO outreach_contacts (id, lead_id, status, suppression_reason) VALUES ('C3','L3','suppressed','gate:mx_missing');
`);
db.pragma("journal_mode = WAL");
db.close();
console.log("✓ Sales-Fixtures (leadfinder_test + outreach-Fixture)");
