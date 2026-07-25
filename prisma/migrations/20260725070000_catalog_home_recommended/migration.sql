-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN "homeRecommended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CatalogProduct" ADD COLUMN "homeRecommendedSort" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CatalogProduct_homeRecommended_homeRecommendedSort_idx" ON "CatalogProduct"("homeRecommended", "homeRecommendedSort");
