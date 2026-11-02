-- Minimal-Schema + Daten der Leadfinder-DB fuer Tests (DB leadfinder_test, nie Prod).
-- Spalten wie in /home/ubuntu/restore/leadfinder/prisma/schema.prisma, soweit genutzt.
DROP TABLE IF EXISTS "ScoreReason";
DROP TABLE IF EXISTS "Company";
DROP TABLE IF EXISTS "Scan";
CREATE TABLE "Scan" (id text PRIMARY KEY, plz text NOT NULL, status text NOT NULL DEFAULT 'done', "createdAt" timestamp NOT NULL DEFAULT now());
CREATE TABLE "Company" (
  id text PRIMARY KEY, name text NOT NULL, website text, email text, phone text, score int,
  "websiteQualityScore" int, "salesProblemScore" int, "scanId" text NOT NULL REFERENCES "Scan"(id),
  "createdAt" timestamp NOT NULL DEFAULT now(), lat double precision, lng double precision, "businessStatus" text
);
CREATE TABLE "ScoreReason" (id text PRIMARY KEY, "companyId" text NOT NULL REFERENCES "Company"(id), key text NOT NULL, message text NOT NULL DEFAULT '', weight int NOT NULL DEFAULT 0);

-- NRW-PLZ: 42499 Hückeswagen, 40210 Düsseldorf, 50667 Köln, 44135 Dortmund. 59610 = Anröchte (NRW) – dort auch FR-Betriebe.
INSERT INTO "Scan"(id, plz, "createdAt") VALUES
 ('s1','42499','2026-06-01'), ('s2','40210','2026-06-01'), ('s3','50667','2026-06-01'), ('s4','44135','2026-06-01'), ('s5','59610','2026-06-01'), ('s6','80331','2026-06-01');

-- Stufe A (gespeicherte Website als unerreichbar markiert); Live-Fixture: Host mit "dead" = DEAD, mit "ok" = OK
INSERT INTO "Company"(id,name,website,email,phone,"salesProblemScore","scanId",lat,lng) VALUES
 ('lfA1','Malerbetrieb Alpha','www.dead-alpha.example','info@dead-alpha.example','+49 2192 111111',100,'s1',51.14,7.34),
 ('lfA2','Pizzeria Bella','dead-bella.example',NULL,'02192 222222',100,'s1',51.14,7.34),
 ('lfA3','Elektro Comeback','ok-comeback.example',NULL,'+49 211 333333',100,'s2',51.22,6.77),
 ('lfA4','Friseur Unklar','unknown-unklar.example',NULL,'+49 221 444444',100,'s3',50.94,6.95);
-- Stufe B (Website schwach laut Datenbestand)
INSERT INTO "Company"(id,name,website,email,phone,"salesProblemScore","scanId",lat,lng) VALUES
 ('lfB1','Tischlerei Weakwood','weak-wood.example','kontakt@weak-wood.example','+49 231 555555',80,'s4',51.51,7.46),
 ('lfB2','Bäckerei Gutseite','ok-gut.example',NULL,'+49 231 666666',60,'s4',51.51,7.46),
 ('lfB3','Autohaus Mobilnummer','weak-mobil.example',NULL,'+49 171 7777777',70,'s4',51.51,7.46),
 ('lfB4','Glaserei Weakglas','weak-glas.example',NULL,'+49 231 252525',65,'s4',51.51,7.46);
-- Stufe C (keine Website)
INSERT INTO "Company"(id,name,website,email,phone,"salesProblemScore","scanId",lat,lng) VALUES
 ('lfC1','Blumen Ohneweb',NULL,NULL,'0221 888888',100,'s3',50.94,6.95),
 ('lfC2','Kosmetikstudio Ohneweb',NULL,'hallo@kosmetik-ohneweb.example','+49 221 999999',100,'s3',50.94,6.95);
-- Ausschluesse
INSERT INTO "Company"(id,name,website,email,phone,"salesProblemScore","scanId",lat,lng,"businessStatus") VALUES
 ('lfX1','Boulangerie Française',NULL,NULL,'03 27 60 12 34',100,'s5',50.01,4.05,NULL),       -- FR 0-Nummer, Koordinaten FR
 ('lfX2','Café Paris','dead-paris.example',NULL,'+33 3 27 60 00 00',100,'s5',50.01,4.05,NULL), -- +33
 ('lfX3','Kette Filiale 1',NULL,NULL,'+49 211 121212',100,'s2',51.22,6.77,NULL),              -- doppelte Nummer
 ('lfX4','Kette Filiale 2',NULL,NULL,'+49 211 121212',100,'s2',51.22,6.77,NULL),
 ('lfX5','Sparkasse Musterstadt',NULL,NULL,'+49 211 131313',100,'s2',51.22,6.77,NULL),          -- Blacklist
 ('lfX6','Uwe Mustermann',NULL,NULL,'+49 211 141414',100,'s2',51.22,6.77,NULL),                -- Personenname
 ('lfX7','Getränke Mismatch','mismatch.example',NULL,'+49 211 151515',100,'s2',51.22,6.77,NULL), -- website_mismatch
 ('lfX8','Metzgerei Geschlossen',NULL,NULL,'+49 211 161616',100,'s2',51.22,6.77,'closed'),      -- closed
 ('lfX9','Optik Muenchen',NULL,NULL,'+49 89 171717',100,'s6',48.14,11.58,NULL),                -- nicht NRW
 ('lfXO','Dachdecker Angemailt','outreach-mailed.example','info@outreach-mailed.example','+49 211 181818',100,'s2',51.22,6.77,NULL), -- outreach contacted
 ('lfXL','Fliesen Rechtsrisiko',NULL,NULL,'+49 211 191919',100,'s2',51.22,6.77,NULL);          -- hard_concern:legal_risk
INSERT INTO "ScoreReason"(id,"companyId",key) VALUES
 ('r1','lfA1','website_unreachable'),('r2','lfA2','website_unreachable'),('r3','lfA3','website_unreachable'),('r4','lfA4','website_unreachable'),
 ('r5','lfB1','no_impressum'),('r6','lfB2','no_mobile'),('r7','lfB3','no_mobile'),('r7b','lfB4','no_impressum'),
 ('r8','lfC1','no_website'),('r9','lfC2','no_website'),('r10','lfX7','website_mismatch'),('r11','lfX2','website_unreachable'),
 ('r12','lfA1','tech_wordpress');
