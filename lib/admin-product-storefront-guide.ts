import {
  STOREFRONT_CATEGORY_LABELS,
  STOREFRONT_SERIES_KEYS,
  STOREFRONT_SERIES_LABELS,
  STOREFRONT_SUBCATEGORY_KEYS,
  STOREFRONT_SUBCATEGORY_LABELS,
  type StorefrontCategorySlug,
} from "@/lib/home-watch-sections";

export {
  STOREFRONT_CATEGORY_LABELS,
  STOREFRONT_SUBCATEGORY_LABELS,
  STOREFRONT_SERIES_LABELS,
} from "@/lib/home-watch-sections";

export function formatSubcategoryReference(): string {
  return STOREFRONT_SUBCATEGORY_KEYS.map(
    (key) => `${key} (${STOREFRONT_SUBCATEGORY_LABELS[key]})`,
  ).join(", ");
}

export function formatSeriesReference(): string {
  return STOREFRONT_SERIES_KEYS.map(
    (key) => `${key} (${STOREFRONT_SERIES_LABELS[key]})`,
  ).join(", ");
}

export function listStorefrontSubcategoryKeys(_category: StorefrontCategorySlug): string[] {
  return [...STOREFRONT_SUBCATEGORY_KEYS];
}

export function listStorefrontSeriesKeys(): string[] {
  return [...STOREFRONT_SERIES_KEYS];
}
