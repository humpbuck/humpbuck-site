/** Cloudflare R2 public development URL (bucket: humpbuck-assets). */
export const R2_PUBLIC_BASE =
  "https://pub-c8982b0d0821469baad86145989f3f64.r2.dev" as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** DIGI-TEMP 2301 — R2 prefix `products/digitemp-2301/{gallery|detail|variants}/`. */
const P2301_SLUG = "digitemp-2301";
const P2301_FILE = "HUMPBUCK-2301";

export const R2 = {
  home: {
    digitemp2301Webp: `${R2_PUBLIC_BASE}/home/HUMPBUCK-2301-first.webp`,
    racingCarJpg: `${R2_PUBLIC_BASE}/home/${encodeURIComponent("Racing car.jpg")}`,
    digitempSpaceMp4: `${R2_PUBLIC_BASE}/home/digitemp-space.mp4`,
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
    },
  },
} as const;
