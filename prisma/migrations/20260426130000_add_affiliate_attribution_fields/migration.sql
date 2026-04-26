-- AlterTable
ALTER TABLE "AffiliateProfile" ADD COLUMN "pid" TEXT;

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "affiliateId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "affiliateAttribution" TEXT,
ADD COLUMN "affiliateId" TEXT,
ADD COLUMN "affiliatePid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_pid_key" ON "AffiliateProfile"("pid");

-- CreateIndex
CREATE INDEX "Coupon_affiliateId_idx" ON "Coupon"("affiliateId");

-- CreateIndex
CREATE INDEX "Order_affiliateId_createdAt_idx" ON "Order"("affiliateId", "createdAt");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

