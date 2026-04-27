-- CreateTable
CREATE TABLE "AffiliateCouponRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateCouponRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateCouponRequest_status_requestedAt_idx" ON "AffiliateCouponRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "AffiliateCouponRequest_userId_requestedAt_idx" ON "AffiliateCouponRequest"("userId", "requestedAt");

-- AddForeignKey
ALTER TABLE "AffiliateCouponRequest" ADD CONSTRAINT "AffiliateCouponRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCouponRequest" ADD CONSTRAINT "AffiliateCouponRequest_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
