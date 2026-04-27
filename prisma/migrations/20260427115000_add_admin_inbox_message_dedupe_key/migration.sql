-- AlterTable
ALTER TABLE "AdminInboxMessage" ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminInboxMessage_dedupeKey_key" ON "AdminInboxMessage"("dedupeKey");
