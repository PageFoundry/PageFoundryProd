CREATE TYPE "WebsitePlanInvoiceStage" AS ENUM ('DEPOSIT', 'FINAL', 'MONTHLY');

CREATE TABLE "WebsitePlan" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "setupPriceCents" INTEGER NOT NULL,
  "depositCents" INTEGER NOT NULL,
  "initialMonthlyCents" INTEGER NOT NULL,
  "initialMonths" INTEGER NOT NULL,
  "laterMonthlyCents" INTEGER NOT NULL,
  "goLiveDate" TIMESTAMP(3),
  "billedMonths" INTEGER NOT NULL DEFAULT 0,
  "cancelledAt" TIMESTAMP(3),
  "clientServiceId" TEXT,
  "hostingProvider" TEXT,
  "hostingRegion" TEXT,
  "backupInterval" TEXT,
  "backupRetention" TEXT,
  "subprocessors" TEXT,
  "supportEmail" TEXT NOT NULL DEFAULT 'admin@pagefoundry.de',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsitePlan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Invoice"
  ADD COLUMN "websitePlanId" TEXT,
  ADD COLUMN "websitePlanStage" "WebsitePlanInvoiceStage",
  ADD COLUMN "websitePlanMonth" INTEGER;

CREATE INDEX "WebsitePlan_clientId_idx" ON "WebsitePlan"("clientId");
CREATE INDEX "WebsitePlan_goLiveDate_idx" ON "WebsitePlan"("goLiveDate");
CREATE INDEX "Invoice_websitePlanId_idx" ON "Invoice"("websitePlanId");
CREATE UNIQUE INDEX "Invoice_websitePlanId_websitePlanStage_websitePlanMonth_key" ON "Invoice"("websitePlanId", "websitePlanStage", "websitePlanMonth");

ALTER TABLE "WebsitePlan" ADD CONSTRAINT "WebsitePlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_websitePlanId_fkey" FOREIGN KEY ("websitePlanId") REFERENCES "WebsitePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
