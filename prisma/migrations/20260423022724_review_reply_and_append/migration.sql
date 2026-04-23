-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN "merchantRepliedAt" DATETIME;
ALTER TABLE "ProductReview" ADD COLUMN "merchantReply" TEXT;

-- CreateTable
CREATE TABLE "ProductReviewAppend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrlsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductReviewAppend_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductReviewAppend_reviewId_createdAt_idx" ON "ProductReviewAppend"("reviewId", "createdAt");
