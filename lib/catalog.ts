import { R2 } from "@/lib/r2";
import { getR2VariantLineImageUrl } from "@/lib/r2-line-image";
import { SITE_LOCALE } from "@/lib/site-locale";

export type SeriesSlug = "digitemp" | "tonneau" | "rd-astral";

export interface SeriesInfo {
  slug: SeriesSlug;
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
  seriesSlug: SeriesSlug;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  galleryImages?: string[];
  detailImages?: string[];
  promoVideo?: { src: string; poster?: string };
  variantOptions?: ProductVariantOption[];
  highlights: string[];
  specs: { label: string; value: string }[];
  inStock: boolean;
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
    heroImage: R2.home.racingCarWebp,
  },
  {
    slug: "rd-astral",
    name: "RD-ASTRAL",
    tagline: "Inspired by childhood nights under the stars.",
    description:
      "RD-ASTRAL draws on the founder as a child—looking up, tracing constellations, trying to glimpse the edge of the cosmos. The watches are our nudge not to let ordinary life wear you down: keep the courage to pursue what you love, and hold onto a sincere passion deep inside. Skeleton architecture and bold dial drama carry that stargazing spirit.",
    theme: "mixed",
    heroImage: R2.home.rdStarWebp,
  },
];

/**
 * Catalog product helper types remain for compatibility with database-mapped products.
 */
export function getSeriesBySlug(slug: string): SeriesInfo | undefined {
  return seriesList.find((s) => s.slug === slug);
}

/**
 * Homepage “Featured” ranking used by the database-backed catalog helper.
 */
const HOME_FEATURED_SALES_RANK: Record<string, number> = {
  "digitemp-2301": 1,
  "digitemp-2412m": 2,
  "rm-m01": 3,
  "rm-m02": 4,
  "rm-m09": 5,
  "rm-m08": 6,
  "rd-excalibur01": 7,
  "rm-m10": 8,
  "rm-m07": 9,
  "rm-m06": 10,
  "rm-m05": 11,
  "rm-m04": 12,
  "rm-m03": 13,
};

const HOME_FEATURED_FALLBACK_RANK = 999;

export async function getHomeFeaturedProducts(limit = 12): Promise<Product[]> {
  const { getMergedCatalogProducts } = await import("@/lib/catalog-db");
  const rank = (slug: string) => HOME_FEATURED_SALES_RANK[slug] ?? HOME_FEATURED_FALLBACK_RANK;
  return (await getMergedCatalogProducts())
    .sort((a, b) => {
      const d = rank(a.slug) - rank(b.slug);
      return d !== 0 ? d : a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { getMergedCatalogProductBySlug } = await import("@/lib/catalog-db");
  return getMergedCatalogProductBySlug(slug);
}

export async function getProductsBySeries(seriesSlug: SeriesSlug): Promise<Product[]> {
  const { getMergedCatalogProducts } = await import("@/lib/catalog-db");
  return (await getMergedCatalogProducts()).filter((p) => p.seriesSlug === seriesSlug);
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
  const r2 = getR2VariantLineImageUrl(product.slug, id ?? variantId);
  if (r2) return r2;
  if (!id) return product.image;
  const match = product.variantOptions.find((v) => v.id === id);
  return match?.image ?? product.image;
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
