-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "homeFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Coupon_homeFeatured_idx" ON "Coupon"("homeFeatured");

-- AlterTable
ALTER TABLE "SiteHomeContent" ADD COLUMN "couponTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "couponQuestion" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "couponSuccessMessage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "couponTagline" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "couponBackgroundImageUrl" TEXT NOT NULL DEFAULT '';
