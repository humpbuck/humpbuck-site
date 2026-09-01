import type { Product } from "@/lib/catalog";
import {
  watchCategorySlugFromCategoryId,
  type StorefrontWatchCategorySlug,
} from "@/lib/storefront-watch-categories";

/**
 * PDP URL middle segment: `/product/{category}/{model}`.
 * Matches fixed storefront category slugs (ANA-DIGI → `ana-digi`).
 */
export type ProductPathCategory =
  | "ana-digi"
  | "digital"
  | "analog"
  | "automatic";

export const PRODUCT_PATH_CATEGORIES = [
  "ana-digi",
  "digital",
  "analog",
  "automatic",
] as const satisfies readonly ProductPathCategory[];

const CATEGORY_SLUG_TO_PATH: Record<
  StorefrontWatchCategorySlug,
  ProductPathCategory
> = {
  "ana-digi": "ana-digi",
  digital: "digital",
  analog: "analog",
  automatic: "automatic",
};

/** Non-canonical path segments → canonical PDP category. */
const PATH_CATEGORY_ALIASES: Record<string, ProductPathCategory> = {
  "ana-digi": "ana-digi",
  "digi-temp": "ana-digi",
  digitemp: "ana-digi",
  quartz: "ana-digi",
  digital: "digital",
  analog: "analog",
  automatic: "automatic",
  mechanical: "automatic",
};

/** Prefixes formerly baked into compound slugs like `digi-temp-2301`. */
const LEGACY_COMPOUND_SLUG_PREFIXES = new Set([
  "digi-temp",
  "digitemp",
  "humpbuck",
  "automatic",
  "analog",
  "digital",
  "ana-digi",
  "rm-tonneau",
  "rm",
  "rd-astral",
  "tonneau",
]);

export function isProductPathCategory(
  value: string,
): value is ProductPathCategory {
  return (PRODUCT_PATH_CATEGORIES as readonly string[]).includes(value);
}

export function normalizeProductPathCategory(
  raw: string | null | undefined,
): ProductPathCategory | null {
  const v = raw?.trim().toLowerCase() ?? "";
  if (!v) return null;
  return PATH_CATEGORY_ALIASES[v] ?? null;
}

export function productPathCategoryFromCategoryId(
  categoryId: string | null | undefined,
): ProductPathCategory | null {
  const slug = watchCategorySlugFromCategoryId(categoryId);
  if (!slug) return null;
  return CATEGORY_SLUG_TO_PATH[slug];
}

export function productPathCategoryFromProduct(
  product: Pick<Product, "slug"> &
    Partial<
      Pick<
        Product,
        "categoryId" | "storefrontCategory" | "categoryLabel" | "seriesSlug"
      >
    >,
): ProductPathCategory {
  const fromId = productPathCategoryFromCategoryId(product.categoryId);
  if (fromId) return fromId;

  const placement = product.storefrontCategory?.trim().toLowerCase();
  if (placement === "quartz") return "ana-digi";
  if (placement === "mechanical") return "automatic";

  const label = product.categoryLabel?.trim().toLowerCase();
  if (label) {
    const fromLabel = normalizeProductPathCategory(label);
    if (fromLabel) return fromLabel;
    if (label === "ana-digi" || label.includes("ana-digi")) return "ana-digi";
    if (label === "digital") return "digital";
    if (label === "analog") return "analog";
    if (label === "automatic" || label === "mechanical") return "automatic";
  }

  // Default: ANA-DIGI (matches historical catalog bias).
  return "ana-digi";
}

/** Canonical storefront path: `/product/ana-digi/2301`. */
export function productHref(
  product: Pick<Product, "slug"> &
    Partial<
      Pick<
        Product,
        "categoryId" | "storefrontCategory" | "categoryLabel" | "seriesSlug"
      >
    >,
): string {
  const slug = product.slug.trim();
  const category = productPathCategoryFromProduct(product);
  return `/product/${category}/${encodeURIComponent(slug)}`;
}

export function productHrefFromParts(
  category: ProductPathCategory,
  slug: string,
): string {
  return `/product/${category}/${encodeURIComponent(slug.trim())}`;
}

/**
 * Absolute-ish path without locale for sitemap / canonical / JSON-LD.
 * Same encoding as {@link productHref}.
 */
export function productPathWithoutLocale(
  product: Pick<Product, "slug"> &
    Partial<
      Pick<
        Product,
        "categoryId" | "storefrontCategory" | "categoryLabel" | "seriesSlug"
      >
    >,
): string {
  return productHref(product);
}

/**
 * When a legacy compound slug (e.g. `digi-temp-2301`) no longer exists in the
 * catalog because the model slug was shortened to `2301`, recover the product.
 */
export function matchProductByLegacyCompoundSlug<
  T extends Pick<Product, "slug"> &
    Partial<
      Pick<
        Product,
        "categoryId" | "storefrontCategory" | "categoryLabel" | "seriesSlug"
      >
    >,
>(pathSlug: string, products: T[]): T | null {
  const lower = pathSlug.trim().toLowerCase();
  if (!lower) return null;

  const exact = products.find((p) => p.slug.trim().toLowerCase() === lower);
  if (exact) return exact;

  const matches = products.filter((p) => {
    const s = p.slug.trim().toLowerCase();
    if (!s || s === lower) return false;
    if (!lower.endsWith(`-${s}`)) return false;
    const prefix = lower.slice(0, -(s.length + 1));
    return (
      LEGACY_COMPOUND_SLUG_PREFIXES.has(prefix) || prefix.startsWith("digi")
    );
  });

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]!;

  const aligned = matches.filter((p) => {
    const s = p.slug.trim().toLowerCase();
    const prefix = lower.slice(0, -(s.length + 1));
    const cat = productPathCategoryFromProduct(p);
    return (
      prefix === cat ||
      (prefix === "digitemp" && cat === "ana-digi") ||
      (prefix === "digi-temp" && cat === "ana-digi") ||
      (prefix === "mechanical" && cat === "automatic") ||
      (prefix === "humpbuck" && (cat === "digital" || cat === "analog"))
    );
  });
  return aligned[0] ?? matches[0]!;
}
