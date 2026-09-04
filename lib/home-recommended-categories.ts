import {
  STOREFRONT_WATCH_CATEGORIES,
  watchCategorySlugFromCategoryId,
  type StorefrontWatchCategoryDef,
  type StorefrontWatchCategorySlug,
} from "@/lib/storefront-watch-categories";

/** Homepage Recommended carousels — display + admin arrange order. */
export const HOME_RECOMMENDED_CATEGORY_ORDER = [
  "ana-digi",
  "digital",
  "analog",
  "automatic",
] as const satisfies readonly StorefrontWatchCategorySlug[];

export type HomeRecommendedCategorySlug =
  (typeof HOME_RECOMMENDED_CATEGORY_ORDER)[number];

const BY_SLUG = new Map(
  STOREFRONT_WATCH_CATEGORIES.map((c) => [c.slug, c] as const),
);

export function homeRecommendedCategoryDefs(): StorefrontWatchCategoryDef[] {
  return HOME_RECOMMENDED_CATEGORY_ORDER.map((slug) => {
    const def = BY_SLUG.get(slug);
    if (!def) throw new Error(`Missing watch category: ${slug}`);
    return def;
  });
}

export function homeRecommendedCategorySlugOf(
  categoryId: string | null | undefined,
): HomeRecommendedCategorySlug | undefined {
  const slug = watchCategorySlugFromCategoryId(categoryId);
  if (!slug) return undefined;
  return (HOME_RECOMMENDED_CATEGORY_ORDER as readonly string[]).includes(slug)
    ? (slug as HomeRecommendedCategorySlug)
    : undefined;
}

/** Flatten per-category id lists into one ordered list (category order × within-section). */
export function flattenHomeRecommendedIdsByCategory(
  byCategory: Record<HomeRecommendedCategorySlug, string[]>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const slug of HOME_RECOMMENDED_CATEGORY_ORDER) {
    for (const id of byCategory[slug] ?? []) {
      const trimmed = id.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

/** Split a flat ordered id list into per-category buckets using each product's categoryId. */
export function splitHomeRecommendedIdsByCategory<
  T extends { id: string; categoryId?: string | null },
>(
  orderedIds: string[],
  products: T[],
): Record<HomeRecommendedCategorySlug, string[]> {
  const byId = new Map(products.map((p) => [p.id, p] as const));
  const buckets: Record<HomeRecommendedCategorySlug, string[]> = {
    "ana-digi": [],
    digital: [],
    analog: [],
    automatic: [],
  };
  for (const id of orderedIds) {
    const product = byId.get(id);
    if (!product) continue;
    const slug = homeRecommendedCategorySlugOf(product.categoryId);
    if (!slug) continue;
    buckets[slug].push(id);
  }
  return buckets;
}
