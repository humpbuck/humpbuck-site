import "server-only";

import { normalizeProductSlug } from "@/lib/admin-product-slug";
import { prisma } from "@/lib/prisma";
import {
  legacyPlacementFromCategory,
} from "@/lib/product-category-shared";
import {
  canonicalCategoryIdForAdminProduct,
  getWatchCategoryBySlug,
  STOREFRONT_WATCH_CATEGORIES,
  watchCategorySlugFromCategoryId,
} from "@/lib/storefront-watch-categories";
import {
  canonicalCategoryIdAfterRemap,
  ensureProductCategorySchema,
} from "@/lib/product-category-schema";

export type ProductCategoryRow = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: Date;
};

export {
  legacyPlacementFromCategory,
  LEGACY_CATALOG_SERIES_REDIRECT,
  normalizeShopSeriesParam,
  shopSeriesHref,
  shopCategoryHref,
  shopHrefForCategorySlug,
} from "@/lib/product-category-shared";

export async function getAllProductCategories(): Promise<ProductCategoryRow[]> {
  await ensureProductCategorySchema();
  return prisma.productCategory.findMany({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
  });
}

/** Fixed public collections only (ANA-DIGI / Digital / Analog / Automatic). */
export async function getFixedStorefrontCategories(): Promise<
  ProductCategoryRow[]
> {
  await ensureProductCategorySchema();
  const fixedIds = STOREFRONT_WATCH_CATEGORIES.map((c) => c.id);
  const rows = await prisma.productCategory.findMany({
    where: { id: { in: fixedIds } },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  // Always expose canonical ids from STOREFRONT_WATCH_CATEGORIES (never legacy CMS ids).
  return STOREFRONT_WATCH_CATEGORIES.map((c) => {
    const row = byId.get(c.id);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: row?.imageUrl ?? null,
      sortOrder: c.sortOrder,
      createdAt: row?.createdAt ?? new Date(0),
    };
  }).sort((a, b) => b.sortOrder - a.sortOrder);
}

export async function getProductCategoryById(
  id: string,
): Promise<ProductCategoryRow | null> {
  await ensureProductCategorySchema();
  return prisma.productCategory.findUnique({ where: { id } });
}

export type CategoryPlacementSave = {
  categoryId: string;
  categoryLabel: string;
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
};

function placementFromFixed(
  fixed: (typeof STOREFRONT_WATCH_CATEGORIES)[number],
): CategoryPlacementSave {
  return {
    categoryId: fixed.id,
    ...legacyPlacementFromCategory({
      name: fixed.name,
      slug: fixed.slug,
    }),
  };
}

export { canonicalCategoryIdForAdminProduct };

/** Resolve categoryId from admin product save body into DB placement fields. */
export async function resolveCategoryPlacementForSave(
  categoryIdRaw: unknown,
  opts?: { categoryLabelHint?: string | null },
): Promise<{ ok: true; data: CategoryPlacementSave } | { ok: false; error: string }> {
  const categoryId =
    typeof categoryIdRaw === "string" ? categoryIdRaw.trim() : "";
  if (!categoryId) {
    return { ok: false, error: "Category is required." };
  }

  const fixedById = STOREFRONT_WATCH_CATEGORIES.find((c) => c.id === categoryId);
  if (fixedById) {
    return { ok: true, data: placementFromFixed(fixedById) };
  }

  const legacySlug = watchCategorySlugFromCategoryId(categoryId);
  if (legacySlug) {
    const fixed = getWatchCategoryBySlug(legacySlug);
    if (fixed) return { ok: true, data: placementFromFixed(fixed) };
  }

  const remappedId = canonicalCategoryIdAfterRemap(categoryId);
  if (remappedId) {
    const fixed = STOREFRONT_WATCH_CATEGORIES.find((c) => c.id === remappedId);
    if (fixed) return { ok: true, data: placementFromFixed(fixed) };
  }

  const category = await getProductCategoryById(categoryId);
  if (category) {
    const canonical =
      STOREFRONT_WATCH_CATEGORIES.find(
        (c) => c.id === category.id || c.slug === category.slug,
      ) ?? null;
    if (!canonical) {
      return {
        ok: false,
        error: "Category must be ANA-DIGI, Digital, Analog, or Automatic.",
      };
    }
    return { ok: true, data: placementFromFixed(canonical) };
  }

  // Stale admin tab: ensure already deleted the CMS row; recover from label hint.
  const fromHint = canonicalCategoryIdForAdminProduct({
    categoryId: "",
    categoryLabel: opts?.categoryLabelHint,
  });
  if (fromHint) {
    const fixed = STOREFRONT_WATCH_CATEGORIES.find((c) => c.id === fromHint);
    if (fixed) return { ok: true, data: placementFromFixed(fixed) };
  }

  return { ok: false, error: "Selected category was not found." };
}

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  const root = normalizeProductSlug(base) || "category";
  let candidate = root;
  let n = 2;
  for (;;) {
    const existing = await prisma.productCategory.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

export async function createProductCategory(input: {
  name: string;
  imageUrl?: string | null;
  slug?: string | null;
}): Promise<ProductCategoryRow> {
  await ensureProductCategorySchema();
  const name = input.name.trim();
  if (!name) throw new Error("Series name is required.");
  const imageUrl = input.imageUrl?.trim() || null;
  const slug = await uniqueCategorySlug(input.slug?.trim() || name);

  const max = await prisma.productCategory.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;

  return prisma.productCategory.create({
    data: { name, slug, imageUrl, sortOrder },
  });
}

export async function updateProductCategory(
  id: string,
  input: { name?: string; imageUrl?: string | null; slug?: string | null },
): Promise<ProductCategoryRow | null> {
  await ensureProductCategorySchema();
  const existing = await prisma.productCategory.findUnique({ where: { id } });
  if (!existing) return null;

  const data: { name?: string; imageUrl?: string | null; slug?: string } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Series name is required.");
    data.name = name;
  }
  if (input.imageUrl !== undefined) {
    data.imageUrl = input.imageUrl?.trim() || null;
  }
  const slugInput = input.slug?.trim();
  if (slugInput) {
    data.slug = await uniqueCategorySlug(slugInput, id);
  }

  return prisma.productCategory.update({ where: { id }, data });
}

export async function deleteProductCategory(id: string): Promise<boolean> {
  await ensureProductCategorySchema();
  try {
    await prisma.productCategory.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/** First id in the list gets the highest sortOrder (shown first). */
export async function reorderProductCategories(
  ids: string[],
): Promise<ProductCategoryRow[]> {
  await ensureProductCategorySchema();
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  await prisma.$transaction(
    unique.map((id, index) =>
      prisma.productCategory.update({
        where: { id },
        data: { sortOrder: unique.length - index },
      }),
    ),
  );
  return getAllProductCategories();
}
