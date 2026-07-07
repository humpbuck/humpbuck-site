ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_affiliateId_fkey";
DROP INDEX IF EXISTS "Order_affiliateId_createdAt_idx";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "affiliateAttribution";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "affiliateId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "affiliatePid";

ALTER TABLE "Coupon" DROP CONSTRAINT IF EXISTS "Coupon_affiliateId_fkey";
DROP INDEX IF EXISTS "Coupon_affiliateId_idx";
ALTER TABLE "Coupon" DROP COLUMN IF EXISTS "affiliateId";

DROP TABLE IF EXISTS "AffiliateCommissionLedger";
DROP TABLE IF EXISTS "AffiliateCouponRequest";
DROP TABLE IF EXISTS "AffiliateApplication";
DROP TABLE IF EXISTS "AffiliateProfile";
DROP TABLE IF EXISTS "AffiliateTier";
