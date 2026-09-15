CREATE TYPE "OptionDocumentItemType" AS ENUM ('BASE', 'CMS', 'MAINTENANCE');

CREATE TABLE "OptionDocument" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "cmsTotalCents" INTEGER NOT NULL DEFAULT 0,
  "maintenanceTotalCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OptionDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OptionDocumentItem" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "optionType" "OptionDocumentItemType" NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "taxRateBps" INTEGER NOT NULL DEFAULT 0,
  "lineNetCents" INTEGER NOT NULL,
  "lineTaxCents" INTEGER NOT NULL,
  "lineGrossCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OptionDocumentItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OptionDocument_number_key" ON "OptionDocument"("number");
CREATE INDEX "OptionDocument_clientId_idx" ON "OptionDocument"("clientId");
CREATE INDEX "OptionDocument_issueDate_idx" ON "OptionDocument"("issueDate");
CREATE INDEX "OptionDocumentItem_documentId_idx" ON "OptionDocumentItem"("documentId");
CREATE INDEX "OptionDocumentItem_optionType_idx" ON "OptionDocumentItem"("optionType");

ALTER TABLE "OptionDocument" ADD CONSTRAINT "OptionDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OptionDocumentItem" ADD CONSTRAINT "OptionDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "OptionDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
