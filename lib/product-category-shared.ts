import {
  getWatchCategoryBySlug,
  STOREFRONT_WATCH_CATEGORIES,
  WATCHES_PATH,
  type StorefrontWatchCategorySlug,
} from "@/lib/storefront-watch-categories";

/**
 * Map admin category → legacy storefront filter fields (shop URLs stay stable).
 * ANA-DIGI uses public slug `ana-digi` (legacy: `quartz` / id `cat_quartz`).
 */
export function legacyPlacementFromCategory(category: {
  name: string;
  slug: string;
}): {
  categoryLabel: string;
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
} {
  const slug = category.slug.trim().toLowerCase();
  if (slug === "ultra-thin") {
    return {
      categoryLabel: category.name,
      storefrontCategory: null,
      storefrontSubcategory: null,
      storefrontSeries: "ultra-thin",
    };
  }
  if (slug === "ana-digi" || slug === "quartz") {
    return {
      categoryLabel: category.name,
      storefrontCategory: "quartz",
      storefrontSubcategory: null,
      storefrontSeries: null,
    };
  }
  if (slug === "mechanical" || slug === "automatic") {
    return {
      categoryLabel: category.name,
      storefrontCategory: "mechanical",
      storefrontSubcategory: null,
      storefrontSeries: null,
    };
  }
  if (slug === "digital" || slug === "analog") {
    return {
      categoryLabel: category.name,
      storefrontCategory: null,
      storefrontSubcategory: null,
      storefrontSeries: null,
    };
  }
  return {
    categoryLabel: category.name,
    storefrontCategory: null,
    storefrontSubcategory: null,
    storefrontSeries: null,
  };
}

/** Old catalog /series/* slugs → public collection slug (empty = all watches). */
export const LEGACY_CATALOG_SERIES_REDIRECT: Record<string, string> = {
  digitemp: "ana-digi",
  "digi-temp": "ana-digi",
  quartz: "ana-digi",
  tonneau: "",
  "rm-tonneau": "",
  "rd-astral": "",
  astral: "",
};

/** Normalize a shop series/category query value (aliases + legacy ids). */
export function normalizeShopSeriesParam(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if (
    v === "cat_quartz" ||
    v === "quartz" ||
    v === "digitemp" ||
    v === "digi-temp"
  ) {
    return "ana-digi";
  }
  if (v === "cat_mechanical" || v === "mechanical") return "automatic";
  if (v === "cat_digital") return "digital";
  if (v === "cat_analog") return "analog";
  if (v === "cat_ultra_thin" || v === "ultra-thin") return "";
  return LEGACY_CATALOG_SERIES_REDIRECT[v] ?? v;
}

/** Public path for a fixed collection slug, or `/watches` for all. */
export function shopCategoryPath(
  seriesSlug: string | null | undefined,
): string {
  const slug = seriesSlug?.trim();
  if (!slug) return WATCHES_PATH;
  const normalized = normalizeShopSeriesParam(slug) || slug;
  const known = getWatchCategoryBySlug(normalized);
  if (known) return known.path;
  return WATCHES_PATH;
}

/** Storefront PRODUCTS menu / shop link — path-based collection URLs. */
export function shopSeriesHref(seriesSlug: string | null | undefined): string {
  return shopCategoryPath(seriesSlug);
}

/** @deprecated Prefer `shopSeriesHref(category.slug)`. */
export function shopCategoryHref(categoryIdOrSlug: string | null | undefined): string {
  return shopSeriesHref(categoryIdOrSlug);
}

/** @deprecated Prefer `shopSeriesHref`. */
export function shopHrefForCategorySlug(slug: string): string {
  return shopSeriesHref(slug);
}

export function fixedStorefrontCategoryNavLinks(): Array<{
  href: string;
  label: string;
}> {
  return [...STOREFRONT_WATCH_CATEGORIES]
    .sort((a, b) => b.sortOrder - a.sortOrder)
    .map((c) => ({ href: c.path, label: c.name }));
}

export function allWatchesHref(): string {
  return WATCHES_PATH;
}

export type { StorefrontWatchCategorySlug };
