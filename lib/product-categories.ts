import "server-only";

import { normalizeProductSlug } from "@/lib/admin-product-slug";
import { prisma } from "@/lib/prisma";
import {
  legacyPlacementFromCategory,
} from "@/lib/product-category-shared";
import { ensureProductCategorySchema } from "@/lib/product-category-schema";

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

/** Resolve categoryId from admin product save body into DB placement fields. */
export async function resolveCategoryPlacementForSave(
  categoryIdRaw: unknown,
): Promise<{ ok: true; data: CategoryPlacementSave } | { ok: false; error: string }> {
  const categoryId =
    typeof categoryIdRaw === "string" ? categoryIdRaw.trim() : "";
  if (!categoryId) {
    return { ok: false, error: "Series is required." };
  }
  const category = await getProductCategoryById(categoryId);
  if (!category) {
    return { ok: false, error: "Selected series was not found." };
  }
  return {
    ok: true,
    data: {
      categoryId: category.id,
      ...legacyPlacementFromCategory(category),
    },
  };
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
