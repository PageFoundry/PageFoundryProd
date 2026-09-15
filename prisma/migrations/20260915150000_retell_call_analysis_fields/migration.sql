ALTER TABLE "CallLead"
    ADD COLUMN "callType" TEXT,
    ADD COLUMN "leadQuality" TEXT,
    ADD COLUMN "serviceInterest" TEXT,
    ADD COLUMN "urgency" TEXT,
    ADD COLUMN "budgetMentioned" BOOLEAN,
    ADD COLUMN "followUpRequired" BOOLEAN,
    ADD COLUMN "callerSentiment" TEXT;
