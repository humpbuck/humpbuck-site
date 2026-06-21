-- CreateEnum
CREATE TYPE "ProductReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN "status" "ProductReviewStatus" NOT NULL DEFAULT 'pending';

-- Existing storefront reviews stay visible
UPDATE "ProductReview" SET "status" = 'approved';

ALTER TABLE "ProductReview" ALTER COLUMN "orderId" DROP NOT NULL;

-- DropIndex
DROP INDEX "ProductReview_userId_orderId_productSlug_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_userId_productSlug_key" ON "ProductReview"("userId", "productSlug");

-- CreateIndex
CREATE INDEX "ProductReview_status_idx" ON "ProductReview"("status");
