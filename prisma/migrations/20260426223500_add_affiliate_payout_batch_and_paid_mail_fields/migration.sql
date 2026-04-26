ALTER TABLE "AffiliateCommissionLedger"
ADD COLUMN "payoutBatchId" TEXT,
ADD COLUMN "payoutTxnRef" TEXT,
ADD COLUMN "paidNote" TEXT,
ADD COLUMN "paidEmailSentAt" TIMESTAMP(3);
