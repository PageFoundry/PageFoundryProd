-- Drift-Bereinigung: "resetToken"/"resetTokenExpiry" existierten nur in der DB,
-- nie im Prisma-Schema und in keiner Zeile Code. Alle 246 User-Zeilen hatten NULL.
DROP INDEX "User_resetToken_key";

ALTER TABLE "User" DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry";
