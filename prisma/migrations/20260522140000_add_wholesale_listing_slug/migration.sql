-- AlterTable
ALTER TABLE "WholesaleListing" ADD COLUMN "slug" TEXT;

UPDATE "WholesaleListing"
SET "slug" = 'listing-' || "id"
WHERE "slug" IS NULL OR TRIM("slug") = '';

ALTER TABLE "WholesaleListing" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleListing_slug_key" ON "WholesaleListing"("slug");
