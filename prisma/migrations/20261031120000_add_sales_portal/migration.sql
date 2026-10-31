-- CreateEnum
CREATE TYPE "SalesLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'MEETING', 'OFFER', 'WON', 'LOST');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SALES';

-- AlterTable
ALTER TABLE "ConsultationBooking" ADD COLUMN     "referredById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commissionPercent" INTEGER,
ADD COLUMN     "referralCode" VARCHAR(32);

-- CreateTable
CREATE TABLE "SalesLead" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "contactName" VARCHAR(200),
    "email" VARCHAR(320),
    "phone" VARCHAR(50),
    "website" VARCHAR(512),
    "websiteHost" VARCHAR(255),
    "emailNorm" VARCHAR(320),
    "notes" TEXT,
    "status" "SalesLeadStatus" NOT NULL DEFAULT 'NEW',
    "oneTimeValueCents" INTEGER,
    "monthlyValueCents" INTEGER,
    "commissionPercentAtWin" INTEGER,
    "wonAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesLead_websiteHost_key" ON "SalesLead"("websiteHost");

-- CreateIndex
CREATE UNIQUE INDEX "SalesLead_emailNorm_key" ON "SalesLead"("emailNorm");

-- CreateIndex
CREATE INDEX "SalesLead_ownerId_status_idx" ON "SalesLead"("ownerId", "status");

-- CreateIndex
CREATE INDEX "ConsultationBooking_referredById_idx" ON "ConsultationBooking"("referredById");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

