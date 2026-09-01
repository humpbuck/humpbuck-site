import "server-only";

import { prisma } from "@/lib/prisma";
import { STOREFRONT_WATCH_CATEGORIES } from "@/lib/storefront-watch-categories";
import { legacyPlacementFromCategory } from "@/lib/product-category-shared";

let productCategorySchemaReady: Promise<void> | null = null;

/**
 * old ProductCategory.id → canonical id, filled while ensure remaps/deletes rows.
 * Lets admin saves that still submit a stale CMS / legacy id resolve after ensure.
 */
const remappedCategoryIdToCanonical = new Map<string, string>();

export function canonicalCategoryIdAfterRemap(
  categoryId: string | null | undefined,
): string | undefined {
  const id = categoryId?.trim();
  if (!id) return undefined;
  return remappedCategoryIdToCanonical.get(id);
}

function rememberCategoryRemap(fromId: string, toId: string): void {
  if (!fromId || fromId === toId) return;
  remappedCategoryIdToCanonical.set(fromId, toId);
}

/** Legacy ProductCategory.slug values that map to a fixed storefront collection. */
const LEGACY_SLUGS_BY_CANONICAL: Record<string, readonly string[]> = {
  "ana-digi": ["ana-digi", "quartz", "digitemp", "digi-temp"],
  digital: ["digital"],
  analog: ["analog"],
  automatic: ["automatic", "mechanical"],
};

/** Legacy / display names that imply a fixed collection. */
const LEGACY_NAMES_BY_CANONICAL: Record<string, readonly string[]> = {
  "ana-digi": ["ana-digi", "quartz", "digi-temp", "digitemp"],
  digital: ["digital"],
  analog: ["analog"],
  automatic: ["automatic", "mechanical"],
};

/** Former canonical / CMS ids that must remapping onto `cat_{slug}`. */
const LEGACY_IDS_BY_CANONICAL: Record<string, readonly string[]> = {
  "ana-digi": ["cat_quartz"],
  digital: [],
  analog: [],
  automatic: ["cat_mechanical"],
};

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

/** Rename legacy Quartz / Mechanical rows toward public ANA-DIGI / Automatic labels. */
async function migrateLegacyCategoryLabels(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    UPDATE "ProductCategory"
    SET "slug" = 'ana-digi', "name" = 'ANA-DIGI'
    WHERE "id" IN ('cat_quartz', 'cat_ana-digi') OR lower("slug") = 'quartz'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "ProductCategory"
    SET "slug" = 'automatic', "name" = 'Automatic'
    WHERE "id" IN ('cat_mechanical', 'cat_automatic') OR lower("slug") = 'mechanical'
  `);
}

/**
 * Ensure each fixed collection has exactly one ProductCategory row at its
 * canonical id (`cat_ana-digi`, `cat_digital`, `cat_analog`, `cat_automatic`).
 * Remap CatalogProduct rows off any duplicate / legacy ids, then delete those rows.
 *
 * CatalogProduct.categoryId has FK → ProductCategory(id) ON UPDATE CASCADE /
 * ON DELETE SET NULL, so the canonical row must exist before remapping products.
 */
async function ensureFixedWatchCategories(): Promise<void> {
  const allRows = await prisma.productCategory.findMany({
    select: { id: true, name: true, slug: true, imageUrl: true },
  });

  for (const c of STOREFRONT_WATCH_CATEGORIES) {
    const slugAliases = new Set(
      (LEGACY_SLUGS_BY_CANONICAL[c.slug] ?? [c.slug]).map((s) => s.toLowerCase()),
    );
    const nameAliases = new Set(
      (LEGACY_NAMES_BY_CANONICAL[c.slug] ?? [c.name]).map((s) =>
        s.toLowerCase(),
      ),
    );
    const legacyIds = new Set(LEGACY_IDS_BY_CANONICAL[c.slug] ?? []);

    const duplicates = allRows.filter((row) => {
      if (row.id === c.id) return false;
      if (legacyIds.has(row.id)) return true;
      const slug = row.slug.trim().toLowerCase();
      const name = row.name.trim().toLowerCase();
      return slugAliases.has(slug) || nameAliases.has(name);
    });

    const placement = legacyPlacementFromCategory({
      name: c.name,
      slug: c.slug,
    });
    const placementFields = {
      categoryLabel: c.name,
      storefrontCategory: placement.storefrontCategory,
      storefrontSubcategory: placement.storefrontSubcategory,
      storefrontSeries: placement.storefrontSeries,
    };

    const imageUrl =
      allRows.find((row) => row.id === c.id)?.imageUrl ??
      duplicates.find((row) => row.imageUrl)?.imageUrl ??
      null;

    let canonicalExists = allRows.some((row) => row.id === c.id);

    if (!canonicalExists && duplicates.length > 0) {
      // Prefer renaming a legacy row's primary key (CASCADE updates product FKs).
      const renameFrom =
        duplicates.find((row) => legacyIds.has(row.id)) ?? duplicates[0]!;
      await prisma.$executeRawUnsafe(
        `UPDATE "ProductCategory" SET "id" = ? WHERE "id" = ?`,
        c.id,
        renameFrom.id,
      );
      rememberCategoryRemap(renameFrom.id, c.id);
      canonicalExists = true;
      // Remaining duplicates still need remapping + delete.
      const renamedAway = renameFrom.id;
      for (let i = duplicates.length - 1; i >= 0; i -= 1) {
        if (duplicates[i]!.id === renamedAway) duplicates.splice(i, 1);
      }
    }

    if (!canonicalExists) {
      await prisma.productCategory.create({
        data: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          sortOrder: c.sortOrder,
          imageUrl,
        },
      });
      canonicalExists = true;
    } else {
      // Slug may still be held by a duplicate until we delete it — free first if needed.
      const slugHolder = await prisma.productCategory.findUnique({
        where: { slug: c.slug },
        select: { id: true },
      });
      if (slugHolder && slugHolder.id !== c.id) {
        await prisma.$executeRawUnsafe(
          `UPDATE "ProductCategory" SET "slug" = ? WHERE "id" = ?`,
          `${c.slug}__legacy_${slugHolder.id.slice(-6)}`,
          slugHolder.id,
        );
        if (!duplicates.some((row) => row.id === slugHolder.id)) {
          duplicates.push({
            id: slugHolder.id,
            name: c.name,
            slug: c.slug,
            imageUrl: null,
          });
        }
      }
      await prisma.productCategory.update({
        where: { id: c.id },
        data: {
          name: c.name,
          slug: c.slug,
          sortOrder: c.sortOrder,
          ...(imageUrl != null ? { imageUrl } : {}),
        },
      });
    }

    const duplicateIds = [
      ...new Set([
        ...duplicates.map((row) => row.id),
        ...[...legacyIds].filter((id) => id !== c.id),
      ]),
    ];

    if (duplicateIds.length > 0) {
      for (const fromId of duplicateIds) {
        rememberCategoryRemap(fromId, c.id);
      }
      await prisma.catalogProduct.updateMany({
        where: { categoryId: { in: duplicateIds } },
        data: {
          categoryId: c.id,
          ...placementFields,
        },
      });
      await prisma.productCategory.deleteMany({
        where: { id: { in: duplicateIds } },
      });
    }

    await prisma.catalogProduct.updateMany({
      where: { categoryId: c.id },
      data: placementFields,
    });

    for (const label of nameAliases) {
      await prisma.$executeRawUnsafe(
        `
        UPDATE "CatalogProduct"
        SET "categoryId" = ?,
            "categoryLabel" = ?,
            "storefrontCategory" = ?,
            "storefrontSubcategory" = ?,
            "storefrontSeries" = ?
        WHERE lower(trim(coalesce("categoryLabel", ''))) = ?
          AND coalesce("categoryId", '') != ?
        `,
        c.id,
        c.name,
        placement.storefrontCategory,
        placement.storefrontSubcategory,
        placement.storefrontSeries,
        label,
        c.id,
      );
    }
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
    SET "categoryId" = 'cat_ana-digi',
        "categoryLabel" = 'ANA-DIGI',
        "storefrontCategory" = 'quartz',
        "storefrontSubcategory" = NULL,
        "storefrontSeries" = NULL
    WHERE "categoryId" = 'cat_quartz'
       OR (
         "categoryId" IS NULL
         AND (
           lower(coalesce("storefrontCategory", '')) = 'quartz'
           OR lower(trim(coalesce("categoryLabel", ''))) IN ('ana-digi', 'quartz')
         )
       )
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "CatalogProduct"
    SET "categoryId" = 'cat_automatic',
        "categoryLabel" = 'Automatic',
        "storefrontCategory" = 'mechanical',
        "storefrontSubcategory" = NULL,
        "storefrontSeries" = NULL
    WHERE "categoryId" = 'cat_mechanical'
       OR (
         "categoryId" IS NULL
         AND (
           lower(coalesce("storefrontCategory", '')) = 'mechanical'
           OR lower(trim(coalesce("categoryLabel", ''))) IN ('automatic', 'mechanical')
         )
       )
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "CatalogProduct"
    SET "categoryId" = 'cat_digital',
        "categoryLabel" = 'Digital',
        "storefrontSubcategory" = NULL,
        "storefrontSeries" = NULL
    WHERE "categoryId" IS NULL
      AND lower(trim(coalesce("categoryLabel", ''))) = 'digital'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "CatalogProduct"
    SET "categoryId" = 'cat_analog',
        "categoryLabel" = 'Analog',
        "storefrontSubcategory" = NULL,
        "storefrontSeries" = NULL
    WHERE "categoryId" IS NULL
      AND lower(trim(coalesce("categoryLabel", ''))) = 'analog'
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
      await migrateLegacyCategoryLabels();
      await ensureFixedWatchCategories();
      await backfillProductCategoryIds();
    })().catch((error) => {
      productCategorySchemaReady = null;
      throw error;
    });
  }
  await productCategorySchemaReady;
}
