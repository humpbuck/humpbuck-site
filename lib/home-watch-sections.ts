import {
  getProductMovement,
  productMatchesAudience,
  productMatchesUltraThin,
  type Product,
  type ShopAudienceFilter,
} from "@/lib/catalog";

/** Admin + storefront placement category (movement family). */
export const STOREFRONT_CATEGORY_SLUGS = ["mechanical", "quartz"] as const;
export type StorefrontCategorySlug = (typeof STOREFRONT_CATEGORY_SLUGS)[number];

/** Admin subcategory — Men / Women under mechanical and quartz. */
export const STOREFRONT_SUBCATEGORY_KEYS = ["men", "women"] as const;
export type StorefrontSubcategorySlug = (typeof STOREFRONT_SUBCATEGORY_KEYS)[number];

/** Optional third level under Men / Women. */
export const STOREFRONT_SERIES_KEYS = ["ultra-thin"] as const;
export type StorefrontSeriesSlug = (typeof STOREFRONT_SERIES_KEYS)[number];

/** Homepage “Search by” slider ids (3 rows). */
export const HOME_WATCH_SECTION_SLUGS = ["mechanical", "quartz", "ultra-thin"] as const;
export type HomeWatchSectionSlug = (typeof HOME_WATCH_SECTION_SLUGS)[number];

export const STOREFRONT_CATEGORY_LABELS: Record<StorefrontCategorySlug, string> = {
  mechanical: "Mechanical",
  quartz: "Quartz",
};

export const STOREFRONT_SUBCATEGORY_LABELS: Record<StorefrontSubcategorySlug, string> = {
  men: "Men",
  women: "Women",
};

export const STOREFRONT_SERIES_LABELS: Record<StorefrontSeriesSlug, string> = {
  "ultra-thin": "Ultra-thin",
};

export function isStorefrontCategorySlug(value: string): value is StorefrontCategorySlug {
  return (STOREFRONT_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function isStorefrontSubcategorySlug(
  value: string,
): value is StorefrontSubcategorySlug {
  return (STOREFRONT_SUBCATEGORY_KEYS as readonly string[]).includes(value);
}

export function isStorefrontSeriesSlug(value: string): value is StorefrontSeriesSlug {
  return (STOREFRONT_SERIES_KEYS as readonly string[]).includes(value);
}

export function isHomeWatchSectionSlug(value: string): value is HomeWatchSectionSlug {
  return (HOME_WATCH_SECTION_SLUGS as readonly string[]).includes(value);
}

export function categoryHasSubcategories(_category: StorefrontCategorySlug): boolean {
  return true;
}

export type HomeWatchPlacementFields = {
  slug: string;
  storefrontCategory?: string | null;
  storefrontSubcategory?: string | null;
  storefrontSeries?: string | null;
};

export function normalizeStorefrontCategoryInput(
  value: unknown,
): StorefrontCategorySlug | null {
  const trimmed = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isStorefrontCategorySlug(trimmed) ? trimmed : null;
}

export function normalizeStorefrontSubcategoryInput(
  value: unknown,
): StorefrontSubcategorySlug | null {
  const trimmed = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isStorefrontSubcategorySlug(trimmed) ? trimmed : null;
}

export function normalizeStorefrontSeriesInput(value: unknown): StorefrontSeriesSlug | null {
  const trimmed = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isStorefrontSeriesSlug(trimmed) ? trimmed : null;
}

/** Map legacy rows that stored ultra-thin as subcategory. */
export function coalesceStorefrontPlacementFields(fields: {
  storefrontCategory?: string | null;
  storefrontSubcategory?: string | null;
  storefrontSeries?: string | null;
}): {
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
} {
  const category = fields.storefrontCategory?.trim() || null;
  let subcategory = fields.storefrontSubcategory?.trim() || null;
  let series = fields.storefrontSeries?.trim() || null;

  if (subcategory?.toLowerCase() === "ultra-thin") {
    series = series || "ultra-thin";
    subcategory = null;
  }

  return { storefrontCategory: category, storefrontSubcategory: subcategory, storefrontSeries: series };
}

export function formatStorefrontCategoryLabel(
  category: StorefrontCategorySlug,
  subKey?: string,
  seriesKey?: string,
): string {
  const parts = [STOREFRONT_CATEGORY_LABELS[category]];
  const sub = normalizeStorefrontSubcategoryInput(subKey);
  if (sub) parts.push(STOREFRONT_SUBCATEGORY_LABELS[sub]);
  const series = normalizeStorefrontSeriesInput(seriesKey);
  if (series) parts.push(STOREFRONT_SERIES_LABELS[series]);
  return parts.join(" · ");
}

function sortBySlug<T extends { slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.slug.localeCompare(b.slug));
}

function hasDbPlacements<T extends HomeWatchPlacementFields>(all: T[]): boolean {
  return all.some((p) => normalizeStorefrontCategoryInput(p.storefrontCategory) != null);
}

/** True when admin assigned optional Ultra-thin series under Men/Women. */
export function productHasStorefrontUltraThinSeries(
  product: HomeWatchPlacementFields,
): boolean {
  const placement = coalesceStorefrontPlacementFields(product);
  return normalizeStorefrontSeriesInput(placement.storefrontSeries) === "ultra-thin";
}

export function hasStorefrontDbPlacements(all: HomeWatchPlacementFields[]): boolean {
  return hasDbPlacements(all);
}

function getDbHomeWatchSectionProducts<T extends Product & HomeWatchPlacementFields>(
  all: T[],
  section: HomeWatchSectionSlug,
): T[] {
  switch (section) {
    case "mechanical":
      return sortBySlug(
        all.filter((p) => {
          const placement = coalesceStorefrontPlacementFields(p);
          const category = normalizeStorefrontCategoryInput(placement.storefrontCategory);
          const sub = normalizeStorefrontSubcategoryInput(placement.storefrontSubcategory);
          const series = normalizeStorefrontSeriesInput(placement.storefrontSeries);
          return category === "mechanical" && sub != null && series !== "ultra-thin";
        }),
      );
    case "quartz":
      return sortBySlug(
        all.filter((p) => {
          const placement = coalesceStorefrontPlacementFields(p);
          const category = normalizeStorefrontCategoryInput(placement.storefrontCategory);
          const sub = normalizeStorefrontSubcategoryInput(placement.storefrontSubcategory);
          const series = normalizeStorefrontSeriesInput(placement.storefrontSeries);
          return category === "quartz" && sub != null && series !== "ultra-thin";
        }),
      );
    case "ultra-thin":
      return sortBySlug(
        all.filter((p) => {
          const placement = coalesceStorefrontPlacementFields(p);
          return normalizeStorefrontSeriesInput(placement.storefrontSeries) === "ultra-thin";
        }),
      );
  }
}

function fallbackHomeWatchSectionProducts<T extends Product>(
  all: T[],
  section: HomeWatchSectionSlug,
): T[] {
  switch (section) {
    case "mechanical":
      return sortBySlug(
        all.filter(
          (p) => getProductMovement(p) === "mechanical" && !productMatchesUltraThin(p),
        ),
      );
    case "quartz":
      return sortBySlug(all.filter((p) => getProductMovement(p) === "quartz"));
    case "ultra-thin":
      return sortBySlug(all.filter((p) => productMatchesUltraThin(p)));
  }
}

/** DB-assigned products for a home row; legacy keyword fallback only when no DB placements exist. */
export function resolveHomeWatchSectionProducts<T extends Product & HomeWatchPlacementFields>(
  all: T[],
  section: HomeWatchSectionSlug,
): T[] {
  if (hasDbPlacements(all)) {
    return getDbHomeWatchSectionProducts(all, section);
  }
  return fallbackHomeWatchSectionProducts(all, section);
}

export function homeWatchSectionShopHref(section: HomeWatchSectionSlug): string {
  switch (section) {
    case "mechanical":
      return "/product?movement=mechanical";
    case "quartz":
      return "/product?movement=quartz";
    case "ultra-thin":
      return "/product?profile=ultra-thin";
  }
}

export function storefrontSubcategoryAudience(
  sub: StorefrontSubcategorySlug | null,
): ShopAudienceFilter | null {
  if (sub === "men") return "men";
  if (sub === "women") return "women";
  return null;
}

export function productMatchesStorefrontSubcategory(
  product: Product,
  sub: StorefrontSubcategorySlug,
): boolean {
  const audience = storefrontSubcategoryAudience(sub);
  return audience ? productMatchesAudience(product, audience) : false;
}

export function productMatchesStorefrontSeries(
  product: Product & HomeWatchPlacementFields,
  series: StorefrontSeriesSlug,
): boolean {
  if (series === "ultra-thin") {
    return productHasStorefrontUltraThinSeries(product);
  }
  return false;
}

export function parseStorefrontPlacementPayload(body: {
  storefrontCategory?: unknown;
  storefrontSubcategory?: unknown;
  storefrontSeries?: unknown;
}): {
  storefrontCategory: StorefrontCategorySlug | null;
  storefrontSubcategory: StorefrontSubcategorySlug | null;
  storefrontSeries: StorefrontSeriesSlug | null;
} {
  const category = normalizeStorefrontCategoryInput(body.storefrontCategory);
  const sub = normalizeStorefrontSubcategoryInput(body.storefrontSubcategory);
  const series = normalizeStorefrontSeriesInput(body.storefrontSeries);
  return {
    storefrontCategory: category,
    storefrontSubcategory: category ? sub : null,
    storefrontSeries: category && sub ? series : null,
  };
}
