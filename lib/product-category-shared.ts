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
  return {
    categoryLabel: category.name,
    storefrontCategory: null,
    storefrontSubcategory: null,
    storefrontSeries: null,
  };
}

/** Old catalog /series/* slugs → shop `?series=` slug (empty = all products). */
export const LEGACY_CATALOG_SERIES_REDIRECT: Record<string, string> = {
  digitemp: "ana-digi",
  "digi-temp": "ana-digi",
  quartz: "ana-digi",
  tonneau: "",
  "rm-tonneau": "",
  "rd-astral": "",
  astral: "",
};

/** Normalize a shop series query value (aliases + legacy ids). */
export function normalizeShopSeriesParam(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if (v === "cat_quartz" || v === "quartz" || v === "digitemp" || v === "digi-temp") {
    return "ana-digi";
  }
  if (v === "cat_mechanical") return "mechanical";
  if (v === "cat_ultra_thin") return "ultra-thin";
  return LEGACY_CATALOG_SERIES_REDIRECT[v] ?? v;
}

/** Storefront PRODUCTS menu / shop link — public slug in `?series=`. */
export function shopSeriesHref(seriesSlug: string | null | undefined): string {
  const slug = seriesSlug?.trim();
  if (!slug) return "/product";
  const normalized = normalizeShopSeriesParam(slug) || slug;
  return `/product?series=${encodeURIComponent(normalized)}`;
}

/** @deprecated Prefer `shopSeriesHref(category.slug)`. */
export function shopCategoryHref(categoryIdOrSlug: string | null | undefined): string {
  return shopSeriesHref(categoryIdOrSlug);
}

/** @deprecated Prefer `shopSeriesHref`. */
export function shopHrefForCategorySlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (s === "quartz") return shopSeriesHref("ana-digi");
  if (s === "mechanical") return shopSeriesHref("mechanical");
  if (s === "ultra-thin") return shopSeriesHref("ultra-thin");
  return shopSeriesHref(s);
}
