import { R2 } from "@/lib/r2";
import { getR2VariantLineImageUrl } from "@/lib/r2-line-image";
import { SITE_LOCALE } from "@/lib/site-locale";
import type { ProductDetailBlock } from "@/lib/product-detail-blocks";

export type KnownSeriesSlug = "digitemp" | "tonneau" | "rd-astral";
/** @deprecated Prefer plain `string`; kept for legacy call sites. */
export type SeriesSlug = KnownSeriesSlug;

export interface SeriesInfo {
  slug: string;
  /** Display + SEO — use hyphenated series tokens consistently (e.g. DIGI-TEMP). */
  name: string;
  tagline: string;
  description: string;
  /** UI hint: digital = cyan/space, luxe = gold/charcoal */
  theme: "digital" | "luxe" | "mixed";
  heroImage: string;
}

export interface ProductVariantOption {
  id: string;
  label: string;
  image: string;
  /** When `false`, this style cannot be added to cart (default: in stock). */
  inStock?: boolean;
  stockQuantity?: number;
}

export interface Product {
  slug: string;
  name: string;
  seriesSlug: string;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  galleryImages?: string[];
  detailImages?: string[];
  detailBlocks?: ProductDetailBlock[];
  promoVideo?: { src: string; poster?: string };
  variantOptions?: ProductVariantOption[];
  highlights: string[];
  specs: { label: string; value: string }[];
  inStock: boolean;
  /** Home “Search by” row (mechanical | quartz | ultra-thin). Set in admin. */
  storefrontCategory?: string;
  storefrontSubcategory?: string;
  storefrontSeries?: string;
}

export function normalizeSeriesSlug(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export type ShopMovementFilter = "mechanical" | "quartz";

export type ShopProfileFilter = "ultra-thin";

export function normalizeShopMovementParam(
  raw: string | undefined | null,
): ShopMovementFilter | null {
  const v = raw?.trim().toLowerCase();
  if (v === "mechanical" || v === "quartz") return v;
  return null;
}

/** Catalog grouping for shop nav — prefers admin storefront category, else legacy series slug. */
export function getProductMovement(
  product: Pick<Product, "seriesSlug" | "storefrontCategory">,
): ShopMovementFilter {
  const fromPlacement = product.storefrontCategory?.trim().toLowerCase();
  if (fromPlacement === "mechanical" || fromPlacement === "quartz") {
    return fromPlacement;
  }
  return normalizeSeriesSlug(product.seriesSlug) === "digitemp" ? "quartz" : "mechanical";
}

/** Infer product-line series from URL slug (admin sets placement, not series slug). */
export function inferSeriesSlugFromProductSlug(slug: string): string {
  const s = normalizeSeriesSlug(slug);
  if (s.startsWith("digitemp") || s.startsWith("digi-")) return "digitemp";
  if (s.startsWith("rm-") || s.startsWith("rm")) return "tonneau";
  if (s.startsWith("rd-")) return "rd-astral";
  return "digitemp";
}

export function normalizeShopProfileParam(
  raw: string | undefined | null,
): ShopProfileFilter | null {
  const v = raw?.trim().toLowerCase();
  if (v === "ultra-thin" || v === "ultrathin") return "ultra-thin";
  return null;
}

export function productMatchesUltraThin(
  product: Pick<
    Product,
    | "name"
    | "slug"
    | "categoryLabel"
    | "shortDescription"
    | "highlights"
    | "storefrontSeries"
  >,
): boolean {
  if (product.storefrontSeries?.trim().toLowerCase() === "ultra-thin") return true;
  const haystack = [
    product.name,
    product.slug,
    product.categoryLabel,
    product.shortDescription,
    ...product.highlights,
  ]
    .join(" ")
    .toLowerCase();
  return /\bultra[\s-]?thin\b/.test(haystack);
}

export type ShopAudienceFilter = "men" | "women";

export function normalizeShopAudienceParam(
  raw: string | undefined | null,
): ShopAudienceFilter | null {
  const v = raw?.trim().toLowerCase();
  if (v === "men" || v === "women") return v;
  return null;
}

function productAudienceHaystack(
  product: Pick<Product, "name" | "categoryLabel" | "slug" | "specs">,
): string {
  return `${product.name} ${product.categoryLabel} ${product.slug} ${product.specs
    .map((s) => `${s.label} ${s.value}`)
    .join(" ")}`.toLowerCase();
}

/** Unisex when untagged — appears under both Men and Women shop links. */
export function productMatchesAudience(
  product: Pick<Product, "name" | "categoryLabel" | "slug" | "specs">,
  audience: ShopAudienceFilter,
): boolean {
  const haystack = productAudienceHaystack(product);
  const womenTagged =
    /\bwomen'?s?\b|\bfemale\b|\bladies\b|\bfor her\b|\bher\b/.test(haystack) &&
    !/\bmen'?s?\b|\bmale\b|\bfor him\b/.test(haystack);
  const menTagged =
    /\bmen'?s?\b|\bmale\b|\bfor him\b|\bhim\b/.test(haystack) &&
    !/\bwomen'?s?\b|\bfemale\b|\bladies\b|\bfor her\b/.test(haystack);
  if (!womenTagged && !menTagged) return true;
  if (audience === "women") return womenTagged;
  return menTagged;
}

export function humanizeSeriesSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Series definitions are kept here for navigation, SEO, and merchandising copy.
 * Product data itself now lives in the database.
 */
export const seriesList: SeriesInfo[] = [
  {
    slug: "digitemp",
    name: "DIGI-TEMP",
    tagline: "Ana-digi multifunction core — dual LCD, full mode stack.",
    description:
      "HUMPBUCK DIGI-TEMP is our flagship ana-digi line: dual LCD readouts with modes for TIME, DATE, alarm (ALM), outdoor temperature (OUT), and stopwatch (STW)—engineered for cockpit-clear legibility in compact stainless steel cases with mineral glass.",
    theme: "digital",
    heroImage: R2.home.spaceshipWebp,
  },
  {
    slug: "tonneau",
    name: "RM-TONNEAU",
    tagline: "Racing pulses, flight-deck focus, and materials that earn their place.",
    description:
      "Some watches remind you of the time. RM-TONNEAU is our reminder that bravery isn’t loud—it’s the decision to move again. The barrel case carries that tension: curved like velocity made solid, open enough to show the work inside. Motorsport, aerospace, and cutting-edge finishing aren’t decoration here; they’re the vocabulary of people who refuse to stall.",
    theme: "luxe",
    heroImage: R2.home.rmTonneauSeriesBackgroundWebp,
  },
  {
    slug: "rd-astral",
    name: "RD-ASTRAL",
    tagline: "Inspired by childhood nights under the stars.",
    description:
      "RD-ASTRAL draws on the founder as a child—looking up, tracing constellations, trying to glimpse the edge of the cosmos. The watches are our nudge not to let ordinary life wear you down: keep the courage to pursue what you love, and hold onto a sincere passion deep inside. Skeleton architecture and bold dial drama carry that stargazing spirit.",
    theme: "mixed",
    heroImage: R2.home.rdAstralSeriesBackgroundWebp,
  },
];

/**
 * Catalog product helper types remain for compatibility with database-mapped products.
 */
export function getSeriesBySlug(slug: string): SeriesInfo | undefined {
  const normalized = normalizeSeriesSlug(slug);
  return seriesList.find((s) => s.slug === normalized);
}

/** Known series copy when present; otherwise a minimal storefront-safe fallback. */
export function resolveSeriesInfo(
  slug: string,
  opts?: { heroImage?: string },
): SeriesInfo {
  const normalized = normalizeSeriesSlug(slug);
  const known = getSeriesBySlug(normalized);
  if (known) return known;
  return {
    slug: normalized,
    name: humanizeSeriesSlug(normalized),
    tagline: "",
    description: "",
    theme: "mixed",
    heroImage: opts?.heroImage ?? R2.home.spaceshipWebp,
  };
}

export function getShopSeriesFilters(
  products: Product[],
): Array<{ slug: string; name: string }> {
  const slugs = new Set(
    products.map((p) => normalizeSeriesSlug(p.seriesSlug)).filter(Boolean),
  );
  const out: Array<{ slug: string; name: string }> = [];
  for (const series of seriesList) {
    if (slugs.has(series.slug)) {
      out.push({ slug: series.slug, name: series.name });
      slugs.delete(series.slug);
    }
  }
  for (const slug of [...slugs].sort((a, b) => a.localeCompare(b))) {
    out.push({ slug, name: humanizeSeriesSlug(slug) });
  }
  return out;
}

export function isKnownSeriesSlug(slug: string): slug is KnownSeriesSlug {
  return slug === "digitemp" || slug === "tonneau" || slug === "rd-astral";
}

export function resolveCatalogVariantId(product: Product, variantId?: string): string | undefined {
  if (!variantId?.trim() || !product.variantOptions?.length) return undefined;
  const t = variantId.trim();
  if (product.variantOptions.some((v) => v.id === t)) return t;
  const noHyphen = /^style(0[1-9]|[1-9]\d?)$/i.exec(t);
  if (noHyphen) {
    const n = parseInt(noHyphen[1], 10);
    if (Number.isFinite(n) && n >= 1) {
      const guess = `style-${String(n).padStart(2, "0")}`;
      if (product.variantOptions.some((v) => v.id === guess)) return guess;
    }
  }
  return t;
}

export function getCartLineImage(product: Product, variantId?: string): string {
  if (!product.variantOptions?.length) return product.image;
  const id = resolveCatalogVariantId(product, variantId);
  if (!id) return product.image;
  const match = product.variantOptions.find((v) => v.id === id);
  if (match?.image?.trim()) return match.image.trim();
  const r2 = getR2VariantLineImageUrl(product.slug, id ?? variantId);
  if (r2) return r2;
  return product.image;
}

/**
 * Single source of truth for “can a buyer add this variant to cart?”
 * (merged `productInventory.quantity` + catalog `inStock` flags from `catalog-db`).
 */
export function isVariantOptionSellable(opt: ProductVariantOption | null | undefined): boolean {
  if (!opt?.id) return false;
  if (opt.inStock === false) return false;
  const qty = opt.stockQuantity;
  if (qty != null) return qty > 0;
  return true;
}

/** Human-readable stock line for the PDP; keep in sync with `isVariantOptionSellable`. */
export function variantOptionStockLabel(
  opt: ProductVariantOption | null | undefined,
  whenNoSelection: string,
): string {
  if (!opt) return whenNoSelection;
  if (!isVariantOptionSellable(opt)) return "Out of stock";
  const qty = opt.stockQuantity;
  if (qty != null && qty <= 10) return `Low stock (${qty})`;
  if (qty != null) return `In stock (${qty})`;
  return "In stock";
}

export function isVariantAvailableForSale(product: Product, variantId?: string): boolean {
  if (!product.inStock) return false;
  if (!product.variantOptions?.length) return true;
  if (!variantId) return false;
  const id = resolveCatalogVariantId(product, variantId) ?? variantId;
  const opt = product.variantOptions.find((v) => v.id === id);
  if (!opt) return false;
  return isVariantOptionSellable(opt);
}

export function formatPrice(usd: number): string {
  const hasFraction = Math.abs(usd % 1) > 1e-6;
  if (hasFraction) {
    const body = new Intl.NumberFormat(SITE_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(usd);
    return `$${body}`;
  }
  return new Intl.NumberFormat(SITE_LOCALE, { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(usd);
}
