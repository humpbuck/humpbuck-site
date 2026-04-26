-- CreateTable
CREATE TABLE "AffiliateCommissionLedger" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderTotalCents" INTEGER NOT NULL,
    "commissionType" TEXT NOT NULL,
    "commissionValue" DOUBLE PRECISION NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "holdDays" INTEGER NOT NULL DEFAULT 30,
    "eligibleAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reversedCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "reversalReason" TEXT,
    "reversedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateCommissionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommissionLedger_orderId_key" ON "AffiliateCommissionLedger"("orderId");

-- CreateIndex
CREATE INDEX "AffiliateCommissionLedger_affiliateId_status_eligibleAt_idx" ON "AffiliateCommissionLedger"("affiliateId", "status", "eligibleAt");

-- AddForeignKey
ALTER TABLE "AffiliateCommissionLedger" ADD CONSTRAINT "AffiliateCommissionLedger_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommissionLedger" ADD CONSTRAINT "AffiliateCommissionLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

