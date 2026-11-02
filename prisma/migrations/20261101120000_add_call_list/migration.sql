-- CreateEnum
CREATE TYPE "CallBatchState" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "CallTier" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "CallEntryStatus" AS ENUM ('OPEN', 'DONE', 'EXPIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CallReached" AS ENUM ('NOT_REACHED', 'VOICEMAIL', 'WRONG_NUMBER', 'REACHED');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('NO_INTEREST', 'CALLBACK', 'DEMO_BOOKED', 'OFFER_REQUESTED', 'DO_NOT_CALL', 'HAS_NEW_WEBSITE');

-- CreateEnum
CREATE TYPE "CallObjection" AS ENUM ('PRICE', 'NO_TIME', 'HAS_PROVIDER', 'NO_NEED', 'OTHER');

-- CreateEnum
CREATE TYPE "CallTaskKind" AS ENUM ('CALLBACK', 'RETRY');

-- CreateEnum
CREATE TYPE "CallTaskState" AS ENUM ('OPEN', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DemoRequestState" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'READY', 'SENT', 'CANCELLED');

-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "leadfinderId" VARCHAR(40),
ADD COLUMN     "phoneNorm" VARCHAR(20);

-- CreateTable
CREATE TABLE "CallListBatch" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "state" "CallBatchState" NOT NULL DEFAULT 'GENERATING',
    "genToken" VARCHAR(40),
    "leaseUntil" TIMESTAMP(3),
    "targetCount" INTEGER NOT NULL,
    "actualCount" INTEGER NOT NULL DEFAULT 0,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "CallListBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallListEntry" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "leadfinderId" VARCHAR(40) NOT NULL,
    "rank" INTEGER NOT NULL,
    "tier" "CallTier" NOT NULL,
    "reasonText" VARCHAR(500) NOT NULL,
    "siteCheck" JSONB,
    "companyName" VARCHAR(200) NOT NULL,
    "phoneNorm" VARCHAR(20) NOT NULL,
    "website" VARCHAR(512),
    "email" VARCHAR(320),
    "plz" VARCHAR(10),
    "city" VARCHAR(120),
    "isMobile" BOOLEAN NOT NULL DEFAULT false,
    "sourceScanAt" TIMESTAMP(3),
    "status" "CallEntryStatus" NOT NULL DEFAULT 'OPEN',
    "salesLeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyClaim" (
    "key" VARCHAR(400) NOT NULL,
    "leadfinderId" VARCHAR(40) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "entryId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyClaim_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CallAttempt" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "entryId" TEXT,
    "taskId" TEXT,
    "phoneNorm" VARCHAR(20) NOT NULL,
    "reasonText" VARCHAR(500) NOT NULL,
    "confirmedText" VARCHAR(300) NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "reached" "CallReached" NOT NULL,
    "contactName" VARCHAR(200),
    "contactRole" VARCHAR(120),
    "isDecisionMaker" BOOLEAN,
    "outcome" "CallOutcome",
    "callbackAt" TIMESTAMP(3),
    "demoAt" TIMESTAMP(3),
    "painPoint" VARCHAR(1000),
    "websiteSituation" VARCHAR(1000),
    "budgetRange" VARCHAR(120),
    "objection" "CallObjection",
    "objectionText" VARCHAR(1000),
    "notes" TEXT,
    "newWebsite" VARCHAR(512),
    "anonymizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallTask" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "CallTaskKind" NOT NULL,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "state" "CallTaskState" NOT NULL DEFAULT 'OPEN',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallBlock" (
    "id" TEXT NOT NULL,
    "phoneNorm" VARCHAR(20),
    "websiteHost" VARCHAR(255),
    "emailNorm" VARCHAR(320),
    "leadfinderId" VARCHAR(40),
    "companyName" VARCHAR(200) NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "state" "DemoRequestState" NOT NULL DEFAULT 'REQUESTED',
    "packageInterest" VARCHAR(40),
    "briefing" TEXT NOT NULL,
    "customerEmail" VARCHAR(320) NOT NULL,
    "meetingAt" TIMESTAMP(3),
    "demoUrl" VARCHAR(512),
    "adminNote" TEXT,
    "sentMessage" TEXT,
    "readyAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallListBatch_ownerId_day_key" ON "CallListBatch"("ownerId", "day");

-- CreateIndex
CREATE INDEX "CallListEntry_leadfinderId_idx" ON "CallListEntry"("leadfinderId");

-- CreateIndex
CREATE UNIQUE INDEX "CallListEntry_batchId_leadfinderId_key" ON "CallListEntry"("batchId", "leadfinderId");

-- CreateIndex
CREATE UNIQUE INDEX "CallListEntry_batchId_rank_key" ON "CallListEntry"("batchId", "rank");

-- CreateIndex
CREATE INDEX "CompanyClaim_entryId_idx" ON "CompanyClaim"("entryId");

-- CreateIndex
CREATE INDEX "CallAttempt_salesLeadId_idx" ON "CallAttempt"("salesLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_attemptId_key" ON "CallLog"("attemptId");

-- CreateIndex
CREATE INDEX "CallLog_salesLeadId_createdAt_idx" ON "CallLog"("salesLeadId", "createdAt");

-- CreateIndex
CREATE INDEX "CallLog_ownerId_createdAt_idx" ON "CallLog"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallTask_salesLeadId_key" ON "CallTask"("salesLeadId");

-- CreateIndex
CREATE INDEX "CallTask_ownerId_state_nextAttemptAt_idx" ON "CallTask"("ownerId", "state", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallBlock_phoneNorm_key" ON "CallBlock"("phoneNorm");

-- CreateIndex
CREATE INDEX "CallBlock_websiteHost_idx" ON "CallBlock"("websiteHost");

-- CreateIndex
CREATE INDEX "CallBlock_emailNorm_idx" ON "CallBlock"("emailNorm");

-- CreateIndex
CREATE INDEX "CallBlock_leadfinderId_idx" ON "CallBlock"("leadfinderId");

-- CreateIndex
CREATE INDEX "DemoRequest_state_createdAt_idx" ON "DemoRequest"("state", "createdAt");

-- CreateIndex
CREATE INDEX "DemoRequest_requestedById_state_idx" ON "DemoRequest"("requestedById", "state");

-- CreateIndex
CREATE INDEX "DemoRequest_salesLeadId_idx" ON "DemoRequest"("salesLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesLead_phoneNorm_key" ON "SalesLead"("phoneNorm");

-- CreateIndex
CREATE UNIQUE INDEX "SalesLead_leadfinderId_key" ON "SalesLead"("leadfinderId");

-- AddForeignKey
ALTER TABLE "CallListBatch" ADD CONSTRAINT "CallListBatch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallListEntry" ADD CONSTRAINT "CallListEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CallListBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallListEntry" ADD CONSTRAINT "CallListEntry_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "CallListEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CallAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTask" ADD CONSTRAINT "CallTask_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTask" ADD CONSTRAINT "CallTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallBlock" ADD CONSTRAINT "CallBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequest" ADD CONSTRAINT "DemoRequest_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoRequest" ADD CONSTRAINT "DemoRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

