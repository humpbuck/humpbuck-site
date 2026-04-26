-- CreateTable
CREATE TABLE "AffiliateTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'percent',
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "riskFlag" BOOLEAN NOT NULL DEFAULT false,
    "tierId" TEXT,
    "whitelist" BOOLEAN NOT NULL DEFAULT false,
    "blacklist" BOOLEAN NOT NULL DEFAULT false,
    "paymentInfoPending" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateId" TEXT,
    "socialLinksJson" TEXT NOT NULL DEFAULT '[]',
    "followerCount" INTEGER,
    "about" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "riskReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTier_name_key" ON "AffiliateTier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_userId_key" ON "AffiliateProfile"("userId");

-- CreateIndex
CREATE INDEX "AffiliateProfile_status_idx" ON "AffiliateProfile"("status");

-- CreateIndex
CREATE INDEX "AffiliateProfile_blacklist_whitelist_idx" ON "AffiliateProfile"("blacklist", "whitelist");

-- CreateIndex
CREATE INDEX "AffiliateApplication_userId_createdAt_idx" ON "AffiliateApplication"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateApplication_status_createdAt_idx" ON "AffiliateApplication"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "AffiliateTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateApplication" ADD CONSTRAINT "AffiliateApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateApplication" ADD CONSTRAINT "AffiliateApplication_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
