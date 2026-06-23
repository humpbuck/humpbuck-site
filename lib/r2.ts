/**
 * Cloudflare R2 public development URL (bucket: humpbuck-assets).
 * For Lighthouse “cache lifetime” on large media, set per-object `Cache-Control` in R2 (see `.env.example` → R2 public object caching).
 */
export const R2_PUBLIC_BASE =
  "https://pub-c8982b0d0821469baad86145989f3f64.r2.dev" as const;

function r2PublicBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

/** Production CDN for `humpbuck-site` bucket (custom domain). */
export const R2_ASSETS_PUBLIC_BASE = "https://assets.humpbuck.com" as const;

/**
 * Homepage mechanical hero — `Home/humpbuck-hero-Image.webp` on R2 (case-sensitive path).
 * Lives on the production bucket/CDN; falls back to `R2_ASSETS_PUBLIC_BASE` when env still points at legacy `r2.dev`.
 * Bump `NEXT_PUBLIC_R2_HUMPBUCK_HERO_REV` after same-name overwrites.
 */
export function mechanicalHeroWebpUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_HUMPBUCK_HERO_REV?.trim() || "1";
  const base = r2PublicBaseUrl();
  const heroBase = base.includes(".r2.dev") ? R2_ASSETS_PUBLIC_BASE : base;
  return `${heroBase}/Home/humpbuck-hero-Image.webp?v=${encodeURIComponent(rev)}`;
}

/**
 * Homepage founder story — `Home/humpbuck-home-pool.webp` on R2.
 * Bump `NEXT_PUBLIC_R2_HUMPBUCK_HOME_POOL_REV` after same-name overwrites.
 */
export function founderStoryHomePoolWebpUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_HUMPBUCK_HOME_POOL_REV?.trim() || "1";
  const base = r2PublicBaseUrl();
  const heroBase = base.includes(".r2.dev") ? R2_ASSETS_PUBLIC_BASE : base;
  return `${heroBase}/Home/humpbuck-home-pool.webp?v=${encodeURIComponent(rev)}`;
}

/**
 * Homepage flagship category section background — `Home/humpbuck-home-hero-01.webp`.
 * Bump `NEXT_PUBLIC_R2_HUMPBUCK_HOME_HERO_01_REV` after same-name overwrites.
 */
export function flagshipCategoryBackgroundWebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_HUMPBUCK_HOME_HERO_01_REV?.trim() || "1";
  const base = r2PublicBaseUrl();
  const heroBase = base.includes(".r2.dev") ? R2_ASSETS_PUBLIC_BASE : base;
  return `${heroBase}/Home/humpbuck-home-hero-01.webp?v=${encodeURIComponent(rev)}`;
}

/**
 * Same filename on R2 keeps the same URL — browsers/CDN cache the old bytes.
 * Bump `NEXT_PUBLIC_R2_RACING_CAR_REV` in `.env.local` (or the default below) after each replace.
 */
function racingCarWebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_RACING_CAR_REV?.trim() || "3";
  const path = `${R2_PUBLIC_BASE}/home/${encodeURIComponent("Racing car.webp")}`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/**
 * RD-ASTRAL homepage / series card — `home/RD Star.webp` on R2.
 * Bump `NEXT_PUBLIC_R2_RD_STAR_REV` after same-name overwrites.
 */
function rdStarWebpUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_RD_STAR_REV?.trim() || "2";
  const path = `${R2_PUBLIC_BASE}/home/${encodeURIComponent("RD Star.webp")}`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/** Homepage + series hero — `home/RM-TONNEAU series background 01.webp` */
function rmTonneauSeriesBackgroundWebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_RM_TONNEAU_SERIES_BG_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/home/${encodeURIComponent("RM-TONNEAU series background 01.webp")}`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/** Homepage + series hero — `home/RD-ASTRAL series background 01.webp` */
function rdAstralSeriesBackgroundWebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_RD_ASTRAL_SERIES_BG_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/home/${encodeURIComponent("RD-ASTRAL series background 01.webp")}`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/**
 * DIGI-TEMP homepage / series card — `home/Spaceship.webp` on R2.
 * Bump `NEXT_PUBLIC_R2_SPACESHIP_REV` after same-name overwrites.
 */
function spaceshipWebpUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_SPACESHIP_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/home/${encodeURIComponent("Spaceship.webp")}`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/**
 * Homepage hero right panel — `home/HUMPBUCK-2301-first.webp` on R2.
 * Bump `NEXT_PUBLIC_R2_HUMPBUCK_2301_FIRST_REV` after same-name overwrites.
 */
function humpbuck2301FirstWebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_HUMPBUCK_2301_FIRST_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/home/HUMPBUCK-2301-first.webp`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/**
 * Homepage DIGI-TEMP spotlight card — `Products/humpbuck-2301/HUMPBUCK-2301-gallery-03.webp` on assets CDN.
 * Bump `NEXT_PUBLIC_R2_HUMPBUCK_2301_HOME_SPOTLIGHT_REV` after same-name overwrites.
 */
function humpbuck2301HomeSpotlightGallery03WebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_HUMPBUCK_2301_HOME_SPOTLIGHT_REV?.trim() || "1";
  return `${R2_ASSETS_PUBLIC_BASE}/Products/humpbuck-2301/HUMPBUCK-2301-gallery-03.webp?v=${encodeURIComponent(rev)}`;
}

/**
 * Hero background — `home/digitemp-space.mp4` on R2.
 * Bump `NEXT_PUBLIC_R2_DIGI_SPACE_MP4_REV` after same-name overwrites.
 */
function digitempSpaceMp4Url(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_DIGI_SPACE_MP4_REV?.trim() || "2";
  return `${R2_PUBLIC_BASE}/home/digitemp-space.mp4?v=${encodeURIComponent(rev)}`;
}

/**
 * Homepage hero background image — `home/digitemp-background.webp` on R2.
 * Bump `NEXT_PUBLIC_R2_DIGITEMP_BACKGROUND_REV` after same-name overwrites.
 */
function digitempBackgroundWebpUrl(): string {
  const rev =
    process.env.NEXT_PUBLIC_R2_DIGITEMP_BACKGROUND_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/home/digitemp-background.webp`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/**
 * About page — `About/HUMPBUCK Promotional Video.mp4` on R2.
 * Bump `NEXT_PUBLIC_R2_ABOUT_PROMO_REV` after same-name overwrites.
 */
function aboutPromotionalVideoUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_ABOUT_PROMO_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/About/${encodeURIComponent("HUMPBUCK Promotional Video.mp4")}`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function productVideoUrl(slugFolder: string, filePrefix: string): string {
  const perProductKey = `NEXT_PUBLIC_R2_VIDEO_REV_${slugFolder
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;
  const rev =
    process.env[perProductKey]?.trim() ||
    process.env.NEXT_PUBLIC_R2_VIDEO_REV?.trim() ||
    "1";
  return `${R2_PUBLIC_BASE}/products/${slugFolder}/video/${filePrefix}-video.mp4?v=${encodeURIComponent(rev)}`;
}

/**
 * Product PDP showcase MP4s — each `products/{slug}/video/{prefix}-video.mp4` on R2 is **720×1280**
 * (portrait, 9:16). The storefront UI assumes this for `ProductPromoVideo` layout.
 */

/** DIGI-TEMP 2301 — R2 prefix `products/digitemp-2301/{gallery|detail|variants}/`. */
const P2301_SLUG = "digitemp-2301";
const P2301_FILE = "HUMPBUCK-2301";

/** DIGI-TEMP 2412M — R2 `products/digitemp-2412m/{gallery|detail|variants|video}/`. */
const P2412_SLUG = "digitemp-2412m";
const P2412_FILE = "HUMPBUCK-2412M";
/** R2 variant folder uses `HUMPBUCK-2401-style-*.webp`; keep filenames aligned with uploaded objects. */
const P2412_VARIANT_FILE = "HUMPBUCK-2401";

/**
 * Variant swatch stills (cart, orders, PDP) — **full** R2 object basename, not just `style-01.webp`.
 *
 * Pattern:
 *   `products/{SLUG_FOLDER}/variants/{FILE_PREFIX}-style-{NN}.webp`
 *
 * Example (RM-M01, style 1):
 *   `products/RM-M01/variants/HUMPBUCK-RM-M01-style-01.webp`
 *
 * `SLUG_FOLDER` / `FILE_PREFIX` must match the bucket (case-sensitive). `NN` is always
 * two digits (`01`–`99`). `variantOptions[].id` in `catalog.ts` is `style-01`, etc.; the
 * **file** name always includes the `HUMPBUCK-{SKU}-` prefix before `-style-NN`.
 */

/** RM-M01 — R2 `products/RM-M01/{gallery|detail|variants|video}/` (folder casing matches bucket). */
const PRMM01_SLUG = "RM-M01";
const PRMM01_FILE = "HUMPBUCK-RM-M01";

/** RM-M02 — R2 `products/RM-M02/{gallery|detail|variants|video}/`. */
const PRMM02_SLUG = "RM-M02";
const PRMM02_FILE = "HUMPBUCK-RM-M02";

/** RM-M03 — R2 counts: gallery ×6, detail ×25, variants ×13 (see bucket). */
const PRMM03_SLUG = "RM-M03";
const PRMM03_FILE = "HUMPBUCK-RM-M03";

/** RM-M04 — R2: gallery ×5, detail ×20, variants ×9 (`HUMPBUCK-RM-M04-*`, flat `variants/`). */
const PRMM04_SLUG = "RM-M04";
const PRMM04_FILE = "HUMPBUCK-RM-M04";

export type R2GallerySpec = {
  slugFolder: string;
  filePrefix: string;
  /**
   * Variant still basename when it differs from `filePrefix`
   * (e.g. `digitemp-2412m` gallery uses `HUMPBUCK-2412M`, variants use `HUMPBUCK-2401`).
   */
  variantFilePrefix?: string;
  /** Middle segment before `-NN.webp`; default `style` (`-style-01.webp`). */
  variantSlug?: string;
};

/**
 * Catalog PDP `slug` → R2 folder + basename for live HEAD discovery (gallery / detail / variants).
 * **Every** `products/{slug}/` SKU in the storefront must have an entry here, or the PDP falls
 * back to static `R2.products.*` counts only (`lib/r2-discover-gallery.ts`).
 */
export const R2_GALLERY_SPECS_BY_SLUG: Record<string, R2GallerySpec> = {
  "digitemp-2301": { slugFolder: P2301_SLUG, filePrefix: P2301_FILE },
  "digitemp-2412m": {
    slugFolder: P2412_SLUG,
    filePrefix: P2412_FILE,
    variantFilePrefix: P2412_VARIANT_FILE,
  },
  "rm-m01": { slugFolder: PRMM01_SLUG, filePrefix: PRMM01_FILE },
  "rm-m02": { slugFolder: PRMM02_SLUG, filePrefix: PRMM02_FILE },
  "rm-m03": { slugFolder: PRMM03_SLUG, filePrefix: PRMM03_FILE },
  "rm-m04": { slugFolder: PRMM04_SLUG, filePrefix: PRMM04_FILE },
  "rm-m05": { slugFolder: "RM-M05", filePrefix: "HUMPBUCK-RM-M05" },
  "rm-m06": { slugFolder: "RM-M06", filePrefix: "HUMPBUCK-RM-M06" },
  "rm-m07": { slugFolder: "RM-M07", filePrefix: "HUMPBUCK-RM-M07" },
  "rm-m08": { slugFolder: "RM-M08", filePrefix: "HUMPBUCK-RM-M08" },
  "rm-m09": { slugFolder: "RM-M09", filePrefix: "HUMPBUCK-RM-M09" },
  "rm-m10": { slugFolder: "RM-M10", filePrefix: "HUMPBUCK-RM-M10" },
  "rm-mx": { slugFolder: "RM-MX", filePrefix: "HUMPBUCK-RM-MX" },
  /** Same R2 folder as `rm-mx`; catalog slug is `rm-mx01`. */
  "rm-mx01": { slugFolder: "RM-MX", filePrefix: "HUMPBUCK-RM-MX" },
  "wholesale-price": { slugFolder: "RM-MX", filePrefix: "HUMPBUCK-RM-MX" },
  "custom-logo-fee": { slugFolder: "RM-MX", filePrefix: "HUMPBUCK-RM-MX" },
  "rd-excalibur01": {
    slugFolder: "RD-Excalibur01",
    filePrefix: "HUMPBUCK-RD-Excalibur01",
  },
};

/**
 * RM-M03 product page — `products/RM-M03/video/HUMPBUCK-RM-M03-video.mp4` (720×1280).
 * Bump `NEXT_PUBLIC_R2_RM_M03_VIDEO_REV` after same-name overwrites on R2.
 */
function rmM03VideoUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_RM_M03_VIDEO_REV?.trim() || "2";
  const path = `${R2_PUBLIC_BASE}/products/${PRMM03_SLUG}/video/${PRMM03_FILE}-video.mp4`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

/**
 * RM-M08 showcase MP4 — bump `NEXT_PUBLIC_R2_RM_M08_VIDEO_REV` after same-name overwrites on R2.
 * PDP poster uses the first carousel image (same as RM-M01).
 */
function rmM08VideoUrl(): string {
  const rev = process.env.NEXT_PUBLIC_R2_RM_M08_VIDEO_REV?.trim() || "1";
  const path = `${R2_PUBLIC_BASE}/products/RM-M08/video/HUMPBUCK-RM-M08-video.mp4`;
  return `${path}?v=${encodeURIComponent(rev)}`;
}

function rmM08ProductAssets() {
  const base = rmTonneauProductAssets("RM-M08", "HUMPBUCK-RM-M08", {
    detail: 21,
    variants: 8,
    /**
     * Public bucket currently serves `-style-NN.webp` (200). If objects are only
     * `…-sty-a-NN.webp`, set `variantSlug: "sty-a"` to match R2 keys.
     */
    variantSlug: "style",
  });
  return { ...base, video: rmM08VideoUrl() };
}

/**
 * RM-M04 stills — bump `NEXT_PUBLIC_R2_RM_M04_REV` after same-name overwrites on R2.
 */
function rmM04ProductAssets() {
  const rev =
    process.env.NEXT_PUBLIC_R2_RM_M04_REV?.trim() || "1";
  const q = `?v=${encodeURIComponent(rev)}`;
  const bump = (path: string) => `${path}${q}`;
  return {
    gallery: Array.from(
      { length: 5 },
      (_, i) =>
        bump(
          `${R2_PUBLIC_BASE}/products/${PRMM04_SLUG}/gallery/${PRMM04_FILE}-gallery-${pad2(i + 1)}.webp`,
        ),
    ),
    detail: Array.from(
      { length: 20 },
      (_, i) =>
        bump(
          `${R2_PUBLIC_BASE}/products/${PRMM04_SLUG}/detail/${PRMM04_FILE}-detail-${pad2(i + 1)}.webp`,
        ),
    ),
    variants: Array.from(
      { length: 9 },
      (_, i) =>
        bump(
          `${R2_PUBLIC_BASE}/products/${PRMM04_SLUG}/variants/${PRMM04_FILE}-style-${pad2(i + 1)}.webp`,
        ),
    ),
    video: productVideoUrl(PRMM04_SLUG, PRMM04_FILE),
  };
}

/** Optional counts when a SKU’s R2 folder has fewer objects than the RM-TONNEAU default. */
type TonneauAssetCounts = {
  gallery?: number;
  detail?: number;
  variants?: number;
  /**
   * Gallery/detail/variants WebP basename on R2 (e.g. `RM-M08`) when it differs from
   * `filePrefix` used for `…-video.mp4` (e.g. `HUMPBUCK-RM-M08`).
   */
  imageFilePrefix?: string;
  /**
   * Variant filename middle segment before `-{NN}.webp`. Default `style` → `-style-01`;
   * `sty-a` → `-sty-a-01` (RM-M08 on R2).
   */
  variantSlug?: string;
};

/**
 * RM-TONNEAU SKUs — default `gallery` ×6, `detail` ×18, `variants` ×7, `video` MP4 (720×1280).
 * Pass `counts` if the bucket has fewer files (avoids broken carousel slides).
 */
function rmTonneauProductAssets(
  slugFolder: string,
  filePrefix: string,
  counts?: TonneauAssetCounts,
) {
  const galleryLen = counts?.gallery ?? 6;
  const detailLen = counts?.detail ?? 18;
  const variantLen = counts?.variants ?? 7;
  const imagePrefix = counts?.imageFilePrefix ?? filePrefix;
  const variantMid = counts?.variantSlug ?? "style";
  return {
    gallery: Array.from(
      { length: galleryLen },
      (_, i) =>
        `${R2_PUBLIC_BASE}/products/${slugFolder}/gallery/${imagePrefix}-gallery-${pad2(i + 1)}.webp`,
    ),
    detail: Array.from(
      { length: detailLen },
      (_, i) =>
        `${R2_PUBLIC_BASE}/products/${slugFolder}/detail/${imagePrefix}-detail-${pad2(i + 1)}.webp`,
    ),
    variants: Array.from(
      { length: variantLen },
      (_, i) =>
        `${R2_PUBLIC_BASE}/products/${slugFolder}/variants/${imagePrefix}-${variantMid}-${pad2(i + 1)}.webp`,
    ),
    video: productVideoUrl(slugFolder, filePrefix),
  };
}

export const R2 = {
  about: {
    /** `About/HUMPBUCK Promotional Video.mp4` (`?v=` cache bust) */
    promotionalVideoMp4: aboutPromotionalVideoUrl(),
  },
  home: {
    /** DIGI-TEMP homepage hero promo — `home/HUMPBUCK-2301-first.webp` (`?v=` cache bust) */
    digitemp2301Webp: humpbuck2301FirstWebpUrl(),
    /** DIGI-TEMP homepage spotlight card — gallery-03 on assets CDN (`?v=` cache bust) */
    digitemp2301SpotlightWebp: humpbuck2301HomeSpotlightGallery03WebpUrl(),
    /** RM-TONNEAU — `home/Racing car.webp` on R2 (URL includes `?v=` cache bust) */
    racingCarWebp: racingCarWebpUrl(),
    /** RD-ASTRAL — `home/RD Star.webp` (URL includes `?v=` cache bust) */
    rdStarWebp: rdStarWebpUrl(),
    rmTonneauSeriesBackgroundWebp: rmTonneauSeriesBackgroundWebpUrl(),
    rdAstralSeriesBackgroundWebp: rdAstralSeriesBackgroundWebpUrl(),
    /** DIGI-TEMP — `home/Spaceship.webp` (URL includes `?v=` cache bust) */
    spaceshipWebp: spaceshipWebpUrl(),
    /** Homepage hero background — `home/digitemp-background.webp` (`?v=` cache bust). */
    digitempBackgroundWebp: digitempBackgroundWebpUrl(),
    digitempSpaceMp4: digitempSpaceMp4Url(),
    /** Founder story — `Home/humpbuck-home-pool.webp` (`?v=` cache bust). */
    founderStoryPoolWebp: founderStoryHomePoolWebpUrl(),
  },
  products: {
    digitemp2301: {
      gallery: Array.from(
        { length: 5 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${P2301_SLUG}/gallery/${P2301_FILE}-gallery-${pad2(i + 1)}.webp`,
      ),
      detail: Array.from(
        { length: 27 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${P2301_SLUG}/detail/${P2301_FILE}-detail-${pad2(i + 1)}.webp`,
      ),
      variants: Array.from(
        { length: 12 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${P2301_SLUG}/variants/${P2301_FILE}-style-${pad2(i + 1)}.webp`,
      ),
      /** 720×1280 product showcase MP4 — see block comment after `pad2` in this file. */
      video: productVideoUrl(P2301_SLUG, P2301_FILE),
    },
    digitemp2412m: {
      gallery: Array.from(
        { length: 6 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${P2412_SLUG}/gallery/${P2412_FILE}-gallery-${pad2(i + 1)}.webp`,
      ),
      detail: Array.from(
        { length: 18 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${P2412_SLUG}/detail/${P2412_FILE}-detail-${pad2(i + 1)}.webp`,
      ),
      variants: Array.from(
        { length: 4 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${P2412_SLUG}/variants/${P2412_VARIANT_FILE}-style-${pad2(i + 1)}.webp`,
      ),
      video: productVideoUrl(P2412_SLUG, P2412_FILE),
    },
    rmM01: {
      gallery: Array.from(
        { length: 6 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM01_SLUG}/gallery/${PRMM01_FILE}-gallery-${pad2(i + 1)}.webp`,
      ),
      detail: Array.from(
        { length: 18 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM01_SLUG}/detail/${PRMM01_FILE}-detail-${pad2(i + 1)}.webp`,
      ),
      variants: Array.from(
        { length: 7 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM01_SLUG}/variants/${PRMM01_FILE}-style-${pad2(i + 1)}.webp`,
      ),
      video: productVideoUrl(PRMM01_SLUG, PRMM01_FILE),
    },
    rmM02: {
      gallery: Array.from(
        { length: 6 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM02_SLUG}/gallery/${PRMM02_FILE}-gallery-${pad2(i + 1)}.webp`,
      ),
      detail: Array.from(
        { length: 28 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM02_SLUG}/detail/${PRMM02_FILE}-detail-${pad2(i + 1)}.webp`,
      ),
      variants: Array.from(
        { length: 16 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM02_SLUG}/variants/${PRMM02_FILE}-style-${pad2(i + 1)}.webp`,
      ),
      video: productVideoUrl(PRMM02_SLUG, PRMM02_FILE),
    },
    rmM03: {
      gallery: Array.from(
        { length: 6 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM03_SLUG}/gallery/${PRMM03_FILE}-gallery-${pad2(i + 1)}.webp`,
      ),
      detail: Array.from(
        { length: 25 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM03_SLUG}/detail/${PRMM03_FILE}-detail-${pad2(i + 1)}.webp`,
      ),
      variants: Array.from(
        { length: 13 },
        (_, i) =>
          `${R2_PUBLIC_BASE}/products/${PRMM03_SLUG}/variants/${PRMM03_FILE}-style-${pad2(i + 1)}.webp`,
      ),
      /** Same object key on R2 — URL includes `?v=` cache bust (see `rmM03VideoUrl`). */
      video: rmM03VideoUrl(),
    },
    rmM04: rmM04ProductAssets(),
    rmM05: rmTonneauProductAssets("RM-M05", "HUMPBUCK-RM-M05", { detail: 20 }),
    rmM06: rmTonneauProductAssets("RM-M06", "HUMPBUCK-RM-M06", {
      gallery: 5,
      detail: 19,
      variants: 8,
    }),
    rmM07: rmTonneauProductAssets("RM-M07", "HUMPBUCK-RM-M07", { detail: 22 }),
    /**
     * `HUMPBUCK-RM-M08-{gallery|detail}-*.webp`, variants `…-sty-a-NN.webp`, video `…-video.mp4`.
     */
    rmM08: rmM08ProductAssets(),
    rmM09: rmTonneauProductAssets("RM-M09", "HUMPBUCK-RM-M09", {
      detail: 29,
      variants: 14,
    }),
    rmM10: rmTonneauProductAssets("RM-M10", "HUMPBUCK-RM-M10", {
      gallery: 7,
      detail: 24,
    }),
    rdExcalibur01: rmTonneauProductAssets(
      "RD-Excalibur01",
      "HUMPBUCK-RD-Excalibur01",
      { detail: 25, variants: 10 },
    ),
  },
  shop: {
    /** Header SHOP dropdown — `products/CK-2413M/variants/HUMPBUCK-CK2413M-style-01.webp` */
    allProductsThumbWebp: `${R2_PUBLIC_BASE}/products/CK-2413M/variants/HUMPBUCK-CK2413M-style-01.webp`,
  },
} as const;
