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
  /**
   * Optional **product** showcase video (e.g. R2 MP4 under `products/…/video/`). **720×1280** (9:16).
   * PDP layout: `ProductPdpMediaColumn` — same position as DIGI-TEMP 2301 site-wide.
   */
  promoVideo?: {
    src: string;
    /** Optional fallback poster; PDP always prefers the first resolved carousel image. */
    poster?: string;
  };
  /** Style / color swatches; main gallery may stay shared across options. */
  variantOptions?: ProductVariantOption[];
  highlights: string[];
  specs: { label: string; value: string }[];
  inStock: boolean;
}

/**
 * Placeholder imagery via Picsum (seeded) where R2 assets are not yet wired.
 */
const IMG = {
  seriesTon: "https://picsum.photos/seed/humpbuck-series-ton/1920/1280",
  seriesAst: "https://picsum.photos/seed/humpbuck-series-ast/1920/1280",
  p2301: R2.products.digitemp2301.gallery[0],
} as const;

/** RD-Excalibur “Iced Out Astral” models — shared PDP spec strip. */
const SPECS_RD_EXCALIBUR_ICED: { label: string; value: string }[] = [
  { label: "Case diameter", value: "45 mm" },
  { label: "Case thickness", value: "14 mm" },
  { label: "Band width", value: "22 mm" },
  { label: "Weight", value: "93 g" },
  { label: "Crystal", value: "Mineral glass" },
  { label: "Case material", value: "Stainless steel" },
  { label: "Clasp", value: "Pin buckle" },
  { label: "Water resistance", value: "30 m" },
];

/**
 * RM-M03–M09 silicone line — eight baseline fields; numeric values mirror RM-M01 where
 * WooCommerce listings omit measurements ([RM TONNEAU category](https://humpbuck.com/product-category/rm-tonneau/)).
 */
const SPECS_RM_TONNEAU_SILICONE: { label: string; value: string }[] = [
  { label: "Case diameter", value: "37.5 mm" },
  { label: "Case thickness", value: "9.4 mm" },
  { label: "Band width", value: "22 mm" },
  { label: "Weight", value: "55.8 g" },
  { label: "Crystal", value: "Mineral glass" },
  { label: "Case material", value: "Stainless steel" },
  { label: "Clasp", value: "Hook & Loop" },
  { label: "Water resistance", value: "30 m" },
];

const SPECS_RM_M05: { label: string; value: string }[] =
  SPECS_RM_TONNEAU_SILICONE.map((row) => {
    if (row.label === "Weight") return { ...row, value: "56 g" };
    if (row.label === "Clasp") return { ...row, value: "Pin buckle" };
    return row;
  });

const SPECS_RM_M06: { label: string; value: string }[] =
  SPECS_RM_TONNEAU_SILICONE.map((row) => {
    if (row.label === "Weight") return { ...row, value: "56 g" };
    if (row.label === "Clasp") return { ...row, value: "Pin buckle" };
    return row;
  });

const SPECS_RM_M07: { label: string; value: string }[] =
  SPECS_RM_TONNEAU_SILICONE.map((row) => {
    if (row.label === "Weight") return { ...row, value: "56 g" };
    if (row.label === "Clasp") return { ...row, value: "Pin buckle" };
    return row;
  });

const SPECS_RM_M08: { label: string; value: string }[] = [
  { label: "Case diameter", value: "47 mm" },
  { label: "Case thickness", value: "18 mm" },
  { label: "Band width", value: "25 mm" },
  { label: "Weight", value: "103 g" },
  { label: "Crystal", value: "Mineral glass" },
  { label: "Case material", value: "Stainless steel" },
  { label: "Clasp", value: "Pin buckle" },
  { label: "Water resistance", value: "30 m" },
];

/** RM-M09 Butterfly Sport — same measurement set as RM-M08 (tonneau + silicone). */
const SPECS_RM_M09: { label: string; value: string }[] = [...SPECS_RM_M08];

/** RM-M04 Skeleton Sport — corrected factory specs (tonneau 46×52 mm). */
const SPECS_RM_M04: { label: string; value: string }[] = [
  { label: "Case diameter", value: "46×52 mm" },
  { label: "Case thickness", value: "18 mm" },
  { label: "Band width", value: "25 mm" },
  { label: "Weight", value: "103 g" },
  { label: "Crystal", value: "Mineral glass" },
  { label: "Case material", value: "Alloy" },
  { label: "Clasp", value: "Pin buckle" },
  { label: "Water resistance", value: "30 m" },
];

/** RM-M10 — transparent polycarbonate case; measurements updated for PDP. */
const SPECS_RM_M10: { label: string; value: string }[] = [
  { label: "Case diameter", value: "47 mm" },
  { label: "Case thickness", value: "18 mm" },
  { label: "Band width", value: "25 mm" },
  { label: "Weight", value: "67 g" },
  { label: "Crystal", value: "Mineral glass" },
  { label: "Case material", value: "Polycarbonate" },
  { label: "Clasp", value: "Pin buckle" },
  { label: "Water resistance", value: "30 m" },
];

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
    tagline:
      "Racing pulses, flight-deck focus, and materials that earn their place.",
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
    promoVideo: {
      src: R2.products.digitemp2301.video,
      poster: R2.products.digitemp2301.gallery[0],
    },
    variantOptions: R2.products.digitemp2301.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
      inStock: i !== 8,
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
    categoryLabel: "DIGI-TEMP · Ana-digi · Stainless",
    shortDescription:
      "HUMPBUCK DIGI-TEMP 2412M — ana-digi stainless watch with dual LCD, alarm, outdoor temperature, and stopwatch modes.",
    description:
      "DIGI-TEMP 2412M delivers the full ana-digi experience: dual digital fields for time/date/12–24h plus temperature and running seconds; mode stack covers TIME, DATE, ALM (alarm), OUT (outdoor temperature), and STW (stopwatch). Backlight and a dedicated mode path keep operation readable in daily use—wrapped in a 40 mm stainless case with mineral crystal and 30 m water resistance.",
    price: 33.6,
    compareAtPrice: 45.7,
    image: R2.products.digitemp2412m.gallery[0],
    images: [...R2.products.digitemp2412m.gallery],
    galleryImages: [...R2.products.digitemp2412m.gallery],
    detailImages: [...R2.products.digitemp2412m.detail],
    promoVideo: {
      src: R2.products.digitemp2412m.video,
      poster: R2.products.digitemp2412m.gallery[0],
    },
    variantOptions: R2.products.digitemp2412m.variants.map((src, i) => ({
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
      { label: "Case diameter", value: "40 mm" },
      { label: "Case thickness", value: "14 mm" },
      { label: "Band width", value: "22 mm" },
      { label: "Weight", value: "118 g" },
      { label: "Crystal", value: "Mineral glass" },
      { label: "Case material", value: "Stainless steel" },
      { label: "Clasp", value: "Butterfly clasp" },
      { label: "Water resistance", value: "30 m" },
    ],
    inStock: true,
  },
  {
    slug: "rm-m01",
    name: "RM-M01 Tonneau Ultra-thin",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Nylon",
    shortDescription:
      "The HUMPBUCK RM-M01 is a high-performance tonneau-shaped sport watch that blends a bold, ultra-thin stainless steel case with a rugged, breathable nylon strap.",
    description:
      "The HUMPBUCK RM-M01 is a high-performance tonneau-shaped sport watch that blends a bold, ultra-thin stainless steel case with a rugged, breathable nylon strap. Powered by a precise quartz movement, it captures a high-end skeleton aesthetic in a lightweight, slim profile, making it the perfect statement piece for both active lifestyles and sophisticated daily wear.",
    price: 24.6,
    compareAtPrice: 38.7,
    image: R2.products.rmM01.gallery[0],
    images: [...R2.products.rmM01.gallery],
    galleryImages: [...R2.products.rmM01.gallery],
    detailImages: [...R2.products.rmM01.detail],
    promoVideo: {
      src: R2.products.rmM01.video,
      poster: R2.products.rmM01.gallery[0],
    },
    variantOptions: R2.products.rmM01.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Ultra-thin tonneau profile",
      "Sport nylon strap",
      "Skeleton-forward dial layout",
    ],
    specs: [
      { label: "Case diameter", value: "37.5 mm" },
      { label: "Case thickness", value: "9.4 mm" },
      { label: "Band width", value: "22 mm" },
      { label: "Weight", value: "55.8 g" },
      { label: "Crystal", value: "Mineral glass" },
      { label: "Case material", value: "Stainless steel" },
      { label: "Clasp", value: "Hook & Loop" },
      { label: "Water resistance", value: "30 m" },
    ],
    inStock: true,
  },
  {
    slug: "rm-m02",
    name: "RM-M02 Tonneau Ultra-thin",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Nylon",
    shortDescription:
      "The HUMPBUCK RM-M02 is a high-performance tonneau-shaped sport watch that blends a bold, ultra-thin stainless steel case with a rugged, breathable nylon strap.",
    description:
      "The HUMPBUCK RM-M02 is a high-performance tonneau-shaped sport watch that blends a bold, ultra-thin stainless steel case with a rugged, breathable nylon strap. Powered by a precise quartz movement, it captures a high-end skeleton aesthetic in a lightweight, slim profile, making it the perfect statement piece for both active lifestyles and sophisticated daily wear.",
    price: 24.6,
    compareAtPrice: 38.7,
    image: R2.products.rmM02.gallery[0],
    images: [...R2.products.rmM02.gallery],
    galleryImages: [...R2.products.rmM02.gallery],
    detailImages: [...R2.products.rmM02.detail],
    promoVideo: {
      src: R2.products.rmM02.video,
      poster: R2.products.rmM02.gallery[0],
    },
    variantOptions: R2.products.rmM02.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Ultra-thin tonneau profile",
      "Sport nylon strap",
      "Skeleton-forward dial layout",
    ],
    specs: [
      { label: "Case diameter", value: "37.5 mm" },
      { label: "Case thickness", value: "9.4 mm" },
      { label: "Band width", value: "22 mm" },
      { label: "Weight", value: "55.8 g" },
      { label: "Crystal", value: "Mineral glass" },
      { label: "Case material", value: "Stainless steel" },
      { label: "Clasp", value: "Hook & Loop" },
      { label: "Water resistance", value: "30 m" },
    ],
    inStock: true,
  },
  {
    slug: "rm-m03",
    name: "RM-M03 Happy Face",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "Blending a classic tonneau silhouette with a pop-art happy face, this timepiece features a robust stainless steel case and precision quartz movement. Finished with a vibrant silicone strap, it's a bold statement piece for modern streetwear style.",
    description:
      "Blending a classic tonneau silhouette with a pop-art happy face, this timepiece features a robust stainless steel case and precision quartz movement. Finished with a vibrant silicone strap, it's a bold statement piece for modern streetwear style.",
    price: 26.2,
    compareAtPrice: 37.6,
    image: R2.products.rmM03.gallery[0],
    images: [...R2.products.rmM03.gallery],
    galleryImages: [...R2.products.rmM03.gallery],
    detailImages: [...R2.products.rmM03.detail],
    promoVideo: {
      src: R2.products.rmM03.video,
      poster: R2.products.rmM03.gallery[0],
    },
    variantOptions: R2.products.rmM03.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Happy-face tonneau personality",
      "Stainless case & premium silicone strap",
      "Skeleton-forward quartz clarity",
    ],
    specs: [
      { label: "Case diameter", value: "43 mm" },
      { label: "Case thickness", value: "13 mm" },
      { label: "Band width", value: "25 mm" },
      { label: "Weight", value: "87.2 g" },
      { label: "Crystal", value: "Mineral glass" },
      { label: "Case material", value: "Stainless steel" },
      { label: "Clasp", value: "Pin buckle" },
      { label: "Water resistance", value: "30 m" },
    ],
    inStock: true,
  },
  {
    slug: "rm-m04",
    name: "RM-M04 Skeleton Sport",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "HUMPBUCK RM-M04 — tonneau skeleton quartz with luxury sport design and silicone strap.",
    description:
      "Matches the RM-M04 Tonneau Skeleton luxury sport storyline: an open-work tonneau dial, quartz heartbeat, and structured silicone strap for confident daily rotation—motorsport spirit without excess hardware noise.",
    price: 24.6,
    compareAtPrice: 33.8,
    image: R2.products.rmM04.gallery[0],
    images: [...R2.products.rmM04.gallery],
    galleryImages: [...R2.products.rmM04.gallery],
    detailImages: [...R2.products.rmM04.detail],
    variantOptions: R2.products.rmM04.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Tonneau skeleton dial",
      "Luxury sport proportion",
      "Silicone strap comfort",
    ],
    specs: [...SPECS_RM_M04],
    inStock: true,
  },
  {
    slug: "rm-m05",
    name: "RM-M05 Tonneau Ultra-thin",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "HUMPBUCK RM-M05 — racing sport quartz with white tonneau steel case and red silicone band.",
    description:
      "Anchored in the RM-M05 racing sport concept: contrasting white steel tonneau case, saturated red silicone band, and a skeleton dial readout that stays legible when you are on the move.",
    price: 25.8,
    compareAtPrice: 37.6,
    image: R2.products.rmM05.gallery[0],
    images: [...R2.products.rmM05.gallery],
    galleryImages: [...R2.products.rmM05.gallery],
    detailImages: [...R2.products.rmM05.detail],
    promoVideo: {
      src: R2.products.rmM05.video,
      poster: R2.products.rmM05.gallery[0],
    },
    variantOptions: R2.products.rmM05.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "White tonneau steel case",
      "Red silicone racing band",
      "Skeleton quartz movement",
    ],
    specs: [...SPECS_RM_M05],
    inStock: true,
  },
  {
    slug: "rm-m06",
    name: "RM-M06 Striped Skeleton",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "HUMPBUCK RM-M06 — luxury tonneau skeleton quartz with pink & white striped steel case.",
    description:
      "Inspired by RM-M06’s striped steel story: a playful dual-tone tonneau case paired with a skeleton dial layout and supple silicone strap—statement enough for weekends, disciplined enough for the office.",
    price: 25.8,
    compareAtPrice: 37.6,
    image: R2.products.rmM06.gallery[0],
    images: [...R2.products.rmM06.gallery],
    galleryImages: [...R2.products.rmM06.gallery],
    detailImages: [...R2.products.rmM06.detail],
    promoVideo: {
      src: R2.products.rmM06.video,
      poster: R2.products.rmM06.gallery[0],
    },
    variantOptions: R2.products.rmM06.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Pink & white striped steel case",
      "Tonneau skeleton display",
      "Premium silicone strap",
    ],
    specs: [...SPECS_RM_M06],
    inStock: true,
  },
  {
    slug: "rm-m07",
    name: "RM-M07 Carbon Texture",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "HUMPBUCK RM-M07 — carbon-fiber texture tonneau case, skeleton quartz sports watch with silicone strap.",
    description:
      "Mirrors the RM-M07 carbon texture proposition: layered case finishing, aviation-meets-motorsport attitude, and an open dial that showcases the quartz architecture—finished with a dependable silicone strap.",
    price: 25.8,
    compareAtPrice: 37.6,
    image: R2.products.rmM07.gallery[0],
    images: [...R2.products.rmM07.gallery],
    galleryImages: [...R2.products.rmM07.gallery],
    detailImages: [...R2.products.rmM07.detail],
    promoVideo: {
      src: R2.products.rmM07.video,
      poster: R2.products.rmM07.gallery[0],
    },
    variantOptions: R2.products.rmM07.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Carbon-fiber texture case",
      "Skeleton quartz display",
      "Sport silicone strap",
    ],
    specs: [...SPECS_RM_M07],
    inStock: true,
  },
  {
    slug: "rm-m08",
    name: "RM-M08 Butterfly Dial",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "HUMPBUCK RM-M08 — butterfly dial skeleton quartz, luxury sport build with premium silicone strap.",
    description:
      "Taken from the RM-M08 butterfly dial storyline: ornate open-work geometry, tonneau posture, and a premium silicone strap that keeps the watch grounded when you layer streetwear or tailoring.",
    price: 26.7,
    compareAtPrice: 41.6,
    image: R2.products.rmM08.gallery[0],
    images: [...R2.products.rmM08.gallery],
    galleryImages: [...R2.products.rmM08.gallery],
    detailImages: [...R2.products.rmM08.detail],
    promoVideo: {
      src: R2.products.rmM08.video,
      poster: R2.products.rmM08.gallery[0],
    },
    variantOptions: R2.products.rmM08.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Butterfly dial skeleton layout",
      "Luxury sport tonneau case",
      "Premium silicone strap",
    ],
    specs: [...SPECS_RM_M08],
    inStock: true,
  },
  {
    slug: "rm-m09",
    name: "RM-M09 Butterfly Sport",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Silicone",
    shortDescription:
      "HUMPBUCK RM-M09 — butterfly dial skeleton quartz with boyfriend-fit presence and premium silicone strap.",
    description:
      "Echoes the RM-M09 butterfly dial boyfriend-watch positioning: oversized wrist charisma, detailed skeleton bridges, and plush silicone—made to pair with relaxed tailoring or weekend layers.",
    price: 26.7,
    compareAtPrice: 41.6,
    image: R2.products.rmM09.gallery[0],
    images: [...R2.products.rmM09.gallery],
    galleryImages: [...R2.products.rmM09.gallery],
    detailImages: [...R2.products.rmM09.detail],
    promoVideo: {
      src: R2.products.rmM09.video,
      poster: R2.products.rmM09.gallery[0],
    },
    variantOptions: R2.products.rmM09.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Butterfly dial skeleton aesthetic",
      "Boyfriend-fit wrist stance",
      "Premium silicone strap",
    ],
    specs: [...SPECS_RM_M09],
    inStock: true,
  },
  {
    slug: "rm-m10",
    name: "RM-M10 Transparent",
    seriesSlug: "tonneau",
    categoryLabel: "RM-TONNEAU · Polycarbonate",
    shortDescription:
      "HUMPBUCK RM-M10 — transparent tonneau skeleton quartz with polycarbonate case and sport strap.",
    description:
      "Grounded in the RM-M10 transparent tonneau story: a featherlight polycarbonate chassis showcases the skeleton module while the strap keeps the watch wearable from café runs to late nights out.",
    price: 24.6,
    compareAtPrice: 36.7,
    image: R2.products.rmM10.gallery[0],
    images: [...R2.products.rmM10.gallery],
    galleryImages: [...R2.products.rmM10.gallery],
    detailImages: [...R2.products.rmM10.detail],
    promoVideo: {
      src: R2.products.rmM10.video,
      poster: R2.products.rmM10.gallery[0],
    },
    variantOptions: R2.products.rmM10.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Transparent polycarbonate tonneau case",
      "Skeleton quartz core",
      "Sport-first strap ergonomics",
    ],
    specs: [...SPECS_RM_M10],
    inStock: true,
  },
  {
    slug: "rd-excalibur01",
    name: "RD-Excalibur01 Iced Out Astral",
    seriesSlug: "rd-astral",
    categoryLabel: "RD-ASTRAL · Iced out",
    shortDescription:
      "RD-Excalibur01 — Iced Out Astral skeleton statement with full bezel presence and luxury-forward finishing.",
    description:
      "Showcase-oriented RD-ASTRAL piece: skeleton architecture and iced-out bezel drama—media served from R2 like DIGI-TEMP and RM-TONNEAU.",
    price: 28.8,
    compareAtPrice: 43.6,
    image: R2.products.rdExcalibur01.gallery[0],
    images: [...R2.products.rdExcalibur01.gallery],
    galleryImages: [...R2.products.rdExcalibur01.gallery],
    detailImages: [...R2.products.rdExcalibur01.detail],
    promoVideo: {
      src: R2.products.rdExcalibur01.video,
      poster: R2.products.rdExcalibur01.gallery[0],
    },
    variantOptions: R2.products.rdExcalibur01.variants.map((src, i) => ({
      id: `style-${String(i + 1).padStart(2, "0")}`,
      label: `Style ${String(i + 1).padStart(2, "0")}`,
      image: src,
    })),
    highlights: [
      "Iced-out bezel presence",
      "Skeleton dial architecture",
      "Statement wrist presence",
    ],
    specs: [...SPECS_RD_EXCALIBUR_ICED],
    inStock: true,
  },
];

export function getAllProducts(): Product[] {
  return products;
}

/**
 * Homepage “Featured” — **lower = better-selling** (shown first). Omitted slugs sort last.
 * Tune when you have analytics; keeps merchandising in one place.
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

/** Grid: 3×4 on `lg` when `limit` is 12. */
export function getHomeFeaturedProducts(limit = 12): Product[] {
  const rank = (slug: string) =>
    HOME_FEATURED_SALES_RANK[slug] ?? HOME_FEATURED_FALLBACK_RANK;
  return [...products]
    .sort((a, b) => {
      const d = rank(a.slug) - rank(b.slug);
      return d !== 0 ? d : a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Map stored line `variantId` to `product.variantOptions[].id`. Checkout / tests
 * sometimes use `style01` while the catalog uses `style-01`.
 */
export function resolveCatalogVariantId(
  product: Product,
  variantId?: string,
): string | undefined {
  if (!variantId?.trim() || !product.variantOptions?.length) {
    return undefined;
  }
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

/** Cart / summaries: use variant swatch image when `variantId` matches catalog options. */
export function getCartLineImage(
  product: Product,
  variantId?: string,
): string {
  if (!product.variantOptions?.length) {
    return product.image;
  }
  const id = resolveCatalogVariantId(product, variantId);
  const r2 = getR2VariantLineImageUrl(
    product.slug,
    id ?? variantId,
  );
  if (r2) return r2;
  if (!id) return product.image;
  const match = product.variantOptions.find((v) => v.id === id);
  return match?.image ?? product.image;
}

/** True if the product is sellable and the chosen variant (if any) is not marked out of stock. */
export function isVariantAvailableForSale(
  product: Product,
  variantId?: string,
): boolean {
  if (!product.inStock) return false;
  if (!product.variantOptions?.length) return true;
  if (!variantId) return false;
  const id = resolveCatalogVariantId(product, variantId) ?? variantId;
  const opt = product.variantOptions.find((v) => v.id === id);
  if (!opt) return false;
  return opt.inStock !== false;
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
    const body = new Intl.NumberFormat(SITE_LOCALE, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(usd);
    return `$${body}`;
  }
  return new Intl.NumberFormat(SITE_LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(usd);
}
