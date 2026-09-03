-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN "homeFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CatalogProduct" ADD COLUMN "homeFeaturedSort" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CatalogProduct_homeFeatured_homeFeaturedSort_idx" ON "CatalogProduct"("homeFeatured", "homeFeaturedSort");
