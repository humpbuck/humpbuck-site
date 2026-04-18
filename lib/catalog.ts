import { R2 } from "@/lib/r2";

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
  /** When set, PDP carousel uses these (e.g. shared gallery); falls back to `images`. */
  galleryImages?: string[];
  /** Long-form images below the main PDP grid. */
  detailImages?: string[];
  /** Style / color swatches; main gallery may stay shared across options. */
  variantOptions?: ProductVariantOption[];
  highlights: string[];
  specs: { label: string; value: string }[];
  inStock: boolean;
}

/**
 * Placeholder imagery via Picsum (seeded). Replace `src` in products with `/image/...` when ready.
 */
const IMG = {
  seriesDigi: "https://picsum.photos/seed/humpbuck-series-digi/1920/1280",
  seriesTon: "https://picsum.photos/seed/humpbuck-series-ton/1920/1280",
  seriesAst: "https://picsum.photos/seed/humpbuck-series-ast/1920/1280",
  p2301: R2.products.digitemp2301.gallery[0],
  p2412: "https://picsum.photos/seed/humpbuck-p2412/1200/1500",
  rm01: "https://picsum.photos/seed/humpbuck-rm01/1200/1500",
  rm07: "https://picsum.photos/seed/humpbuck-rm07/1200/1500",
  rd01: "https://picsum.photos/seed/humpbuck-rd01/1200/1500",
  g9262: "https://picsum.photos/seed/humpbuck-9262/1200/1500",
} as const;

export const seriesList: SeriesInfo[] = [
  {
    slug: "digitemp",
    name: "DIGI-TEMP",
    tagline: "Ana-digi multifunction core — dual LCD, full mode stack.",
    description:
      "HUMPBUCK DIGI-TEMP is our flagship ana-digi line: dual LCD readouts with modes for TIME, DATE, alarm (ALM), outdoor temperature (OUT), and stopwatch (STW)—engineered for cockpit-clear legibility in compact stainless steel cases with mineral glass.",
    theme: "digital",
    heroImage: IMG.seriesDigi,
  },
  {
    slug: "tonneau",
    name: "RM-TONNEAU",
    tagline:
      "Racing pulses, flight-deck focus, and materials that earn their place.",
    description:
      "Some watches remind you of the time. RM-TONNEAU is our reminder that bravery isn’t loud—it’s the decision to move again. The barrel case carries that tension: curved like velocity made solid, open enough to show the work inside. Motorsport, aerospace, and cutting-edge finishing aren’t decoration here; they’re the vocabulary of people who refuse to stall.",
    theme: "luxe",
    heroImage: R2.home.racingCarJpg,
  },
  {
    slug: "rd-astral",
    name: "RD-ASTRAL",
    tagline: "Inspired by childhood nights under the stars.",
    description:
      "RD-ASTRAL draws on the founder as a child—looking up, tracing constellations, trying to glimpse the edge of the cosmos. The watches are our nudge not to let ordinary life wear you down: keep the courage to pursue what you love, and hold onto a sincere passion deep inside. Skeleton architecture and bold dial drama carry that stargazing spirit.",
    theme: "mixed",
    heroImage: IMG.seriesAst,
  },
];

export const products: Product[] = [
  {
    slug: "digitemp-2301",
    name: "DIGI-TEMP 2301",
    seriesSlug: "digitemp",
    categoryLabel: "DIGI-TEMP · Ana-digi · Stainless",
    shortDescription:
      "HUMPBUCK DIGI-TEMP 2301 — ana-digi stainless watch with dual LCD, alarm, outdoor temperature, and stopwatch modes.",
    description:
      "DIGI-TEMP 2301 delivers the full ana-digi experience: dual digital fields for time/date/12–24h plus temperature and running seconds; mode stack covers TIME, DATE, ALM (alarm), OUT (outdoor temperature), and STW (stopwatch). Backlight and a dedicated mode path keep operation readable in daily use—wrapped in a 33 mm stainless case with mineral crystal and 30 m water resistance.",
    price: 26.3,
    compareAtPrice: 38.6,
    image: IMG.p2301,
    images: [...R2.products.digitemp2301.gallery],
    galleryImages: [...R2.products.digitemp2301.gallery],
    detailImages: [...R2.products.digitemp2301.detail],
    variantOptions: R2.products.digitemp2301.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Modes: TIME · DATE · ALM · OUT · STW",
      "Dual LCD — primary (time, date, 12/24h) + secondary (temperature, seconds)",
      "Backlight + mode selection; compact stainless steel case & bracelet",
      "Factory-rated 30 m WR — see manual for care",
    ],
    specs: [
      { label: "Case diameter", value: "33 mm" },
      { label: "Case thickness", value: "10 mm" },
      { label: "Band width", value: "23 mm" },
      { label: "Weight", value: "72 g" },
      { label: "Crystal", value: "Mineral glass" },
      { label: "Case material", value: "Stainless steel" },
      { label: "Clasp", value: "Hook buckle" },
      { label: "Water resistance", value: "30 m" },
    ],
    inStock: true,
  },
  {
    slug: "digitemp-2412m",
    name: "DIGI-TEMP 2412M",
    seriesSlug: "digitemp",
    categoryLabel: "DIGI-TEMP · Ana-digi · Compact",
    shortDescription:
      "DIGI-TEMP 2412M — same DIGI-TEMP mode core in a tighter footprint for smaller wrists or minimal bulk.",
    description:
      "Part of the DIGI-TEMP family: TIME, DATE, ALM, OUT, and STW remain available with the same ana-digi readability focus—tuned for a slightly more compact footprint while keeping dual LCD clarity and stainless construction.",
    price: 229,
    image: IMG.p2412,
    images: [IMG.p2412, IMG.p2301],
    highlights: [
      "DIGI-TEMP core: TIME · DATE · ALM · OUT · STW",
      "Dual LCD legibility in a compact profile",
      "Backlight + quick mode access",
    ],
    specs: [
      { label: "Series", value: "DIGI-TEMP" },
      { label: "Movement style", value: "Ana-digi module" },
      { label: "Water resistance", value: "See case back / manual" },
    ],
    inStock: true,
  },
  {
    slug: "rm-m01",
    name: "RM-M01 Tonneau Ultra-thin",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Nylon",
    shortDescription:
      "RM-TONNEAU M01 — ultra-thin tonneau case with sporty nylon strap and skeleton-forward dial.",
    description:
      "A clean RM-TONNEAU daily driver: racing-line tonneau silhouette, quartz reliability, and a comfortable nylon strap—positioned as a design-led alternative to the DIGI-TEMP ana-digi flagship.",
    price: 329,
    compareAtPrice: 379,
    image: IMG.rm01,
    images: [IMG.rm01, IMG.seriesTon],
    highlights: [
      "Ultra-thin tonneau profile",
      "Sport nylon strap",
      "Skeleton-forward dial layout",
    ],
    specs: [
      { label: "Collection", value: "RM-TONNEAU" },
      { label: "Movement", value: "Quartz" },
      { label: "Case", value: "Steel-tone tonneau" },
      { label: "Strap", value: "Nylon · quick release" },
    ],
    inStock: true,
  },
  {
    slug: "rm-m07",
    name: "RM-M07 Carbon Texture",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "RM-TONNEAU M07 — carbon-texture tonneau case with skeleton quartz dial and silicone strap.",
    description:
      "Texture-forward RM-TONNEAU finishing for a tech-luxe wrist presence—distinct from DIGI-TEMP’s ana-digi module, aimed at buyers prioritizing barrel-case aesthetics.",
    price: 349,
    image: IMG.rm07,
    images: [IMG.rm07, IMG.g9262],
    highlights: [
      "Carbon-fiber texture case",
      "Skeleton quartz display",
      "Premium silicone strap",
    ],
    specs: [
      { label: "Collection", value: "RM-TONNEAU" },
      { label: "Movement", value: "Quartz skeleton" },
      { label: "Strap", value: "Silicone" },
    ],
    inStock: true,
  },
  {
    slug: "rd-excalibur01",
    name: "RD-Excalibur01 RD-ASTRAL Skeleton",
    seriesSlug: "rd-astral",
    categoryLabel: "RD-ASTRAL · Skeleton statement",
    shortDescription:
      "RD-Excalibur01 — RD-ASTRAL high-impact skeleton dial with luxury-forward finishing.",
    description:
      "Showcase-oriented RD-ASTRAL piece for collectors who want strong dial architecture—complementary to DIGI-TEMP and RM-TONNEAU in the broader HUMPBUCK catalog.",
    price: 459,
    compareAtPrice: 529,
    image: IMG.rd01,
    images: [IMG.rd01, IMG.seriesAst],
    highlights: [
      "RD-ASTRAL skeleton dial drama",
      "Polished case detailing",
      "Statement wrist presence",
    ],
    specs: [
      { label: "Line", value: "RD-ASTRAL" },
      { label: "Movement", value: "Quartz · skeleton styling" },
      { label: "Case", value: "Polished + detail insets" },
    ],
    inStock: true,
  },
  {
    slug: "9262g-triangular",
    name: "9262G Triangular Racing",
    seriesSlug: "rd-astral",
    categoryLabel: "RD-ASTRAL · Racing geometry",
    shortDescription:
      "9262G — RD-ASTRAL triangular racing case with bold lines and high-contrast readability.",
    description:
      "Angular case geometry for a motorsport-coded look—RD-ASTRAL gallery pieces alongside DIGI-TEMP and RM-TONNEAU without blending series keywords.",
    price: 199,
    image: IMG.g9262,
    images: [IMG.g9262],
    highlights: [
      "Triangular racing case",
      "High-contrast dial layout",
      "Sport ergonomics",
    ],
    specs: [
      { label: "Line", value: "RD-ASTRAL" },
      { label: "Movement", value: "Quartz" },
    ],
    inStock: true,
  },
];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** Cart / summaries: use variant swatch image when `variantId` matches catalog options. */
export function getCartLineImage(
  product: Product,
  variantId?: string,
): string {
  if (!variantId || !product.variantOptions?.length) {
    return product.image;
  }
  const match = product.variantOptions.find((v) => v.id === variantId);
  return match?.image ?? product.image;
}

export function getSeriesBySlug(slug: string): SeriesInfo | undefined {
  return seriesList.find((s) => s.slug === slug);
}

export function getProductsBySeries(seriesSlug: SeriesSlug): Product[] {
  return products.filter((p) => p.seriesSlug === seriesSlug);
}

export function formatPrice(usd: number): string {
  const hasFraction = Math.abs(usd % 1) > 1e-6;
  if (hasFraction) {
    const body = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(usd);
    return `$${body}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(usd);
}
