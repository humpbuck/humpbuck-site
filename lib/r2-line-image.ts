import { R2_GALLERY_SPECS_BY_SLUG, R2_PUBLIC_BASE, type R2GallerySpec } from "@/lib/r2";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 0-based style index from `style-01` / `style01` (same idea as `resolveCatalogVariantId`). */
export function styleIndexFromVariantId(variantId: string | undefined): number | null {
  if (!variantId?.trim()) return null;
  const t = variantId.trim();
  const m = /^style-(\d+)$/i.exec(t);
  if (m) return Math.max(0, parseInt(m[1], 10) - 1);
  const m2 = /^style(0[1-9]|[1-9]\d?)$/i.exec(t);
  if (m2) return Math.max(0, parseInt(m2[1], 10) - 1);
  return null;
}

/** Trailing `-NN.webp` style index on R2 variant stills (e.g. `-style-07` → 7). */
export function styleNumFromR2VariantUrl(src: string): number | null {
  const base = src.split("/").pop() ?? "";
  const m = /(\d{1,2})\.webp$/i.exec(base);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function buildVariantUrl(spec: R2GallerySpec, zeroBasedIndex: number): string {
  const variantPrefix = spec.variantFilePrefix ?? spec.filePrefix;
  const variantMid = spec.variantSlug ?? "style";
  return `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/variants/${variantPrefix}-${variantMid}-${pad2(zeroBasedIndex + 1)}.webp`;
}

/**
 * Cart / order line: canonical R2 variant URL when the product has a PDP gallery spec
 * (matches `getPdpR2Media` / ListObjects naming; avoids stale `?v=` or wrong static counts).
 */
export function getR2VariantLineImageUrl(
  productSlug: string,
  catalogVariantId: string | undefined,
): string | null {
  const spec = R2_GALLERY_SPECS_BY_SLUG[productSlug];
  if (!spec) return null;
  const idx = styleIndexFromVariantId(catalogVariantId);
  if (idx == null) return null;
  return buildVariantUrl(spec, idx);
}
