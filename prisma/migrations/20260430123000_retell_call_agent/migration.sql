-- CreateEnum
CREATE TYPE "RetellProjectType" AS ENUM ('website', 'redesign', 'seo', 'hosting', 'web_app', 'other');

-- CreateTable
CREATE TABLE "CallLead" (
    "id" TEXT NOT NULL,
    "retellCallId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "reason" TEXT NOT NULL,
    "projectType" "RetellProjectType",
    "appointmentRequested" BOOLEAN NOT NULL DEFAULT false,
    "appointmentBooked" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDateTime" TIMESTAMP(3),
    "transcript" TEXT,
    "callStatus" TEXT NOT NULL DEFAULT 'new',
    "summary" TEXT,
    "noAppointmentReason" TEXT,
    "discordNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "status" TEXT NOT NULL DEFAULT 'booked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallLead_retellCallId_key" ON "CallLead"("retellCallId");

-- CreateIndex
CREATE INDEX "CallLead_createdAt_idx" ON "CallLead"("createdAt");

-- CreateIndex
CREATE INDEX "CallLead_appointmentBooked_appointmentDateTime_idx" ON "CallLead"("appointmentBooked", "appointmentDateTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_leadId_idx" ON "CalendarEvent"("leadId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDateTime_endDateTime_idx" ON "CalendarEvent"("startDateTime", "endDateTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CallLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
