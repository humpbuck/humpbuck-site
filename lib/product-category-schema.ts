import "server-only";

import { prisma } from "@/lib/prisma";
import { STOREFRONT_WATCH_CATEGORIES } from "@/lib/storefront-watch-categories";

let productCategorySchemaReady: Promise<void> | null = null;

async function tableExists(name: string): Promise<boolean> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    name,
  )) as { name: string }[];
  return rows.length > 0;
}

async function addCatalogProductColumnIfMissing(
  column: string,
  definition: string,
): Promise<void> {
  const columns = (await prisma.$queryRawUnsafe(
    `PRAGMA table_info("CatalogProduct")`,
  )) as { name: string }[];
  if (columns.some((c) => c.name === column)) return;
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "CatalogProduct" ADD COLUMN "${column}" ${definition}`,
  );
}

async function seedDefaultCategoriesIfEmpty(): Promise<void> {
  const count = await prisma.productCategory.count();
  if (count > 0) return;

  await prisma.productCategory.createMany({
    data: STOREFRONT_WATCH_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
    })),
  });
}

/** Rename legacy Quartz slug → public ANA-DIGI series slug. */
async function migrateAnaDigiCategorySlug(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    UPDATE "ProductCategory"
    SET "slug" = 'ana-digi', "name" = 'ANA-DIGI'
    WHERE "id" = 'cat_quartz' OR lower("slug") = 'quartz'
  `);
}

/** Fixed four storefront collections; Automatic public slug is `automatic` (was `mechanical`). */
async function ensureFixedWatchCategories(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    UPDATE "ProductCategory"
    SET "slug" = 'automatic', "name" = 'Automatic'
    WHERE "id" = 'cat_mechanical' OR lower("slug") = 'mechanical'
  `);

  for (const c of STOREFRONT_WATCH_CATEGORIES) {
    const existing = await prisma.productCategory.findUnique({
      where: { id: c.id },
      select: { id: true },
    });
    if (existing) {
      await prisma.productCategory.update({
        where: { id: c.id },
        data: {
          name: c.name,
          slug: c.slug,
          sortOrder: c.sortOrder,
        },
      });
      continue;
    }
    const bySlug = await prisma.productCategory.findUnique({
      where: { slug: c.slug },
      select: { id: true },
    });
    if (bySlug) {
      await prisma.productCategory.update({
        where: { id: bySlug.id },
        data: {
          name: c.name,
          sortOrder: c.sortOrder,
        },
      });
      continue;
    }
    await prisma.productCategory.create({
      data: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
      },
    });
  }
}

async function backfillProductCategoryIds(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    UPDATE "CatalogProduct"
    SET "categoryId" = 'cat_ultra_thin',
        "categoryLabel" = 'Ultra-thin',
        "storefrontSubcategory" = NULL
    WHERE "categoryId" IS NULL
      AND lower(coalesce("storefrontSeries", '')) = 'ultra-thin'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "CatalogProduct"
    SET "categoryId" = 'cat_quartz',
        "categoryLabel" = 'ANA-DIGI',
        "storefrontSubcategory" = NULL,
        "storefrontSeries" = NULL
    WHERE "categoryId" IS NULL
      AND lower(coalesce("storefrontCategory", '')) = 'quartz'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "CatalogProduct"
    SET "categoryId" = 'cat_mechanical',
        "categoryLabel" = 'Automatic',
        "storefrontSubcategory" = NULL,
        "storefrontSeries" = NULL
    WHERE "categoryId" IS NULL
      AND lower(coalesce("storefrontCategory", '')) = 'mechanical'
  `);
}

/** Ensures ProductCategory table + CatalogProduct.categoryId exist, then seeds/backfills. */
export async function ensureProductCategorySchema(): Promise<void> {
  if (!productCategorySchemaReady) {
    productCategorySchemaReady = (async () => {
      if (!(await tableExists("ProductCategory"))) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE "ProductCategory" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "slug" TEXT NOT NULL,
            "imageUrl" TEXT,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await prisma.$executeRawUnsafe(
          `CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug")`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX "ProductCategory_sortOrder_idx" ON "ProductCategory"("sortOrder")`,
        );
      }

      await addCatalogProductColumnIfMissing("categoryId", "TEXT");
      await seedDefaultCategoriesIfEmpty();
      await migrateAnaDigiCategorySlug();
      await ensureFixedWatchCategories();
      await backfillProductCategoryIds();
    })().catch((error) => {
      productCategorySchemaReady = null;
      throw error;
    });
  }
  await productCategorySchemaReady;
}
