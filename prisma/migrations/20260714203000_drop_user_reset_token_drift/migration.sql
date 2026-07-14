-- Drift-Bereinigung: "resetToken"/"resetTokenExpiry" existierten nur in der Live-DB,
-- nie im Prisma-Schema und in keiner Zeile Code. Alle 246 User-Zeilen hatten NULL.
--
-- IF EXISTS ist Pflicht: keine frühere Migration hat diese Spalten je angelegt, sie
-- stammen aus einem manuellen Eingriff. Auf einer frischen DB (Test-DB, Neuaufbau)
-- gibt es sie nicht — ohne IF EXISTS würde die Migration dort scheitern.
DROP INDEX IF EXISTS "User_resetToken_key";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "resetToken",
  DROP COLUMN IF EXISTS "resetTokenExpiry";
