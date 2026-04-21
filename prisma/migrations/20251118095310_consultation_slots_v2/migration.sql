/*
  Warnings:

  - You are about to drop the `ConsultationRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('LANDING_PAGE', 'SEO_AUDIT', 'CONTENT_COPY', 'ECOMMERCE_OPTIMIZATION', 'FULL_SITE_REVIEW', 'CONVERSION_OPT', 'SYSTEMS_AUTOMATION', 'SPEED_AUDIT');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "brief" JSONB,
ADD COLUMN     "priceCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" VARCHAR(512),
ADD COLUMN     "name" VARCHAR(191),
ADD COLUMN     "provider" VARCHAR(20),
ADD COLUMN     "providerId" VARCHAR(191);

-- DropTable
DROP TABLE "ConsultationRequest";

-- DropEnum
DROP TYPE "ConsultationSlot";

-- CreateTable
CREATE TABLE "ConsultationSlot" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "temporaryReservedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationBooking" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "userId" TEXT,
    "email" VARCHAR(320) NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 1,
    "consultationType" "ConsultationType" NOT NULL,
    "description" TEXT NOT NULL,
    "zoomUrl" VARCHAR(512) NOT NULL,
    "stripeSessionId" VARCHAR(191),
    "stripePaymentIntentId" VARCHAR(191),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationDayOff" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationDayOff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationSlot_start_idx" ON "ConsultationSlot"("start");

-- CreateIndex
CREATE INDEX "ConsultationSlot_isBooked_temporaryReservedUntil_idx" ON "ConsultationSlot"("isBooked", "temporaryReservedUntil");

-- CreateIndex
CREATE INDEX "ConsultationBooking_email_idx" ON "ConsultationBooking"("email");

-- CreateIndex
CREATE INDEX "ConsultationBooking_stripeSessionId_idx" ON "ConsultationBooking"("stripeSessionId");

-- CreateIndex
CREATE INDEX "ConsultationBooking_stripePaymentIntentId_idx" ON "ConsultationBooking"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationDayOff_date_key" ON "ConsultationDayOff"("date");

-- CreateIndex
CREATE INDEX "User_provider_providerId_idx" ON "User"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ConsultationSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
