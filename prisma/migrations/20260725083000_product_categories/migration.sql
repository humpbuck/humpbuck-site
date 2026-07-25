-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- CreateIndex
CREATE INDEX "ProductCategory_sortOrder_idx" ON "ProductCategory"("sortOrder");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CatalogProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seriesSlug" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "compareAtPrice" REAL,
    "oemOdmPrice" REAL,
    "image" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "highlightsJson" TEXT NOT NULL DEFAULT '[]',
    "specsJson" TEXT NOT NULL DEFAULT '[]',
    "galleryJson" TEXT NOT NULL DEFAULT '[]',
    "detailJson" TEXT NOT NULL DEFAULT '[]',
    "variantsJson" TEXT NOT NULL DEFAULT '[]',
    "promoVideoJson" TEXT,
    "categoryId" TEXT,
    "storefrontCategory" TEXT,
    "storefrontSubcategory" TEXT,
    "storefrontSeries" TEXT,
    "homeSpotlight" BOOLEAN NOT NULL DEFAULT false,
    "homeRecommended" BOOLEAN NOT NULL DEFAULT false,
    "homeRecommendedSort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CatalogProduct" ("id", "slug", "name", "seriesSlug", "categoryLabel", "shortDescription", "description", "price", "compareAtPrice", "oemOdmPrice", "image", "status", "inStock", "highlightsJson", "specsJson", "galleryJson", "detailJson", "variantsJson", "promoVideoJson", "storefrontCategory", "storefrontSubcategory", "storefrontSeries", "homeSpotlight", "homeRecommended", "homeRecommendedSort", "createdAt", "updatedAt")
SELECT "id", "slug", "name", "seriesSlug", "categoryLabel", "shortDescription", "description", "price", "compareAtPrice", "oemOdmPrice", "image", "status", "inStock", "highlightsJson", "specsJson", "galleryJson", "detailJson", "variantsJson", "promoVideoJson", "storefrontCategory", "storefrontSubcategory", "storefrontSeries", "homeSpotlight", "homeRecommended", "homeRecommendedSort", "createdAt", "updatedAt" FROM "CatalogProduct";
DROP TABLE "CatalogProduct";
ALTER TABLE "new_CatalogProduct" RENAME TO "CatalogProduct";
CREATE UNIQUE INDEX "CatalogProduct_slug_key" ON "CatalogProduct"("slug");
CREATE INDEX "CatalogProduct_homeRecommended_homeRecommendedSort_idx" ON "CatalogProduct"("homeRecommended", "homeRecommendedSort");
CREATE INDEX "CatalogProduct_categoryId_idx" ON "CatalogProduct"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Seed default categories (nav order: ANA-DIGI → Ultra-thin → Automatic)
INSERT INTO "ProductCategory" ("id", "name", "slug", "imageUrl", "sortOrder", "createdAt")
VALUES
  ('cat_quartz', 'ANA-DIGI', 'quartz', NULL, 3, CURRENT_TIMESTAMP),
  ('cat_ultra_thin', 'Ultra-thin', 'ultra-thin', NULL, 2, CURRENT_TIMESTAMP),
  ('cat_mechanical', 'Automatic', 'mechanical', NULL, 1, CURRENT_TIMESTAMP);

-- Backfill product → category from legacy placement fields
UPDATE "CatalogProduct"
SET "categoryId" = 'cat_ultra_thin',
    "categoryLabel" = 'Ultra-thin',
    "storefrontSubcategory" = NULL
WHERE lower(coalesce("storefrontSeries", '')) = 'ultra-thin';

UPDATE "CatalogProduct"
SET "categoryId" = 'cat_quartz',
    "categoryLabel" = 'ANA-DIGI',
    "storefrontSubcategory" = NULL,
    "storefrontSeries" = NULL
WHERE "categoryId" IS NULL AND lower(coalesce("storefrontCategory", '')) = 'quartz';

UPDATE "CatalogProduct"
SET "categoryId" = 'cat_mechanical',
    "categoryLabel" = 'Automatic',
    "storefrontSubcategory" = NULL,
    "storefrontSeries" = NULL
WHERE "categoryId" IS NULL AND lower(coalesce("storefrontCategory", '')) = 'mechanical';
