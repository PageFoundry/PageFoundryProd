ALTER TABLE "Invoice" ALTER COLUMN "dueDate" DROP NOT NULL;

ALTER TABLE "WebsitePlan"
  ADD COLUMN "laterPriceConfirmed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "contractSignedAt" TIMESTAMP(3),
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "documentDraftsDisabled" BOOLEAN NOT NULL DEFAULT false;
