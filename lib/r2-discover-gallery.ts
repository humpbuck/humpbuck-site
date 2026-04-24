import { unstable_cache } from "next/cache";
import { R2_PUBLIC_BASE, type R2GallerySpec } from "@/lib/r2";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** @internal Exported for R2 video HEAD checks in `r2-pdp-media.ts`. */
export async function headOk(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  const opts = { signal: ctrl.signal, cache: "no-store" } as const;
  try {
    const res = await fetch(url, { method: "HEAD", ...opts });
    if (res.ok) return true;
    /* Public R2 / some CDNs reject HEAD; a tiny ranged GET still proves the object exists. */
    if (res.status === 403 || res.status === 405 || res.status === 400) {
      const r2 = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, ...opts });
      return r2.ok;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Public R2 URLs for `gallery-01.webp` … `gallery-NN` — **every** existing index up to
 * `maxSlots` (gaps allowed; e.g. missing 01 but 02+ present still resolves).
 * Parallel HEAD batch — one round-trip wall time per section (cached).
 */
async function discoverIndexedGalleryUrls(
  spec: R2GallerySpec,
  maxSlots: number,
): Promise<string[]> {
  const urls = Array.from(
    { length: maxSlots },
    (_, i) =>
      `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/gallery/${spec.filePrefix}-gallery-${pad2(i + 1)}.webp`,
  );
  const ok = await Promise.all(urls.map((u) => headOk(u)));
  const out: string[] = [];
  for (let i = 0; i < maxSlots; i++) {
    if (ok[i]) out.push(urls[i]);
  }
  return out;
}

/** Raised caps + included in `unstable_cache` keys so limit bumps invalidate stale entries. */
const CACHED_MAX_GALLERY_SLOTS = 36;
/** Detail strips (RM-M02 ×28, RM-M09 ×29+, RM-M10+; long runs on R2). */
const CACHED_MAX_DETAIL_SLOTS = 72;
/** Variant swatches (RM-M09 ×14, RD-Excalibur ×10, headroom). */
const CACHED_MAX_VARIANT_SLOTS = 40;
const REVALIDATE_SEC = 300;

/**
 * Cached gallery URL list from live R2 (numbered slots; gaps do not stop discovery).
 * Returns `null` if discovery fails or yields no files (caller should use catalog fallback).
 */
export async function getDiscoveredGalleryUrls(
  spec: R2GallerySpec,
): Promise<string[] | null> {
  if (process.env.R2_GALLERY_DISCOVER === "0") {
    return null;
  }
  const cached = unstable_cache(
    () => discoverIndexedGalleryUrls(spec, CACHED_MAX_GALLERY_SLOTS),
    [
      "r2-gallery",
      spec.slugFolder,
      spec.filePrefix,
      String(CACHED_MAX_GALLERY_SLOTS),
    ],
    { revalidate: REVALIDATE_SEC },
  );
  try {
    const urls = await cached();
    return urls.length > 0 ? urls : null;
  } catch {
    return null;
  }
}

async function discoverIndexedDetailUrls(
  spec: R2GallerySpec,
  maxSlots: number,
): Promise<string[]> {
  const urls = Array.from(
    { length: maxSlots },
    (_, i) =>
      `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/detail/${spec.filePrefix}-detail-${pad2(i + 1)}.webp`,
  );
  const ok = await Promise.all(urls.map((u) => headOk(u)));
  const out: string[] = [];
  for (let i = 0; i < maxSlots; i++) {
    if (ok[i]) out.push(urls[i]);
  }
  return out;
}

/**
 * Cached detail strip URLs from live R2 (`detail/{filePrefix}-detail-01.webp` … gaps allowed).
 * Same toggle as gallery/variants: `R2_GALLERY_DISCOVER=0` skips discovery.
 */
export async function getDiscoveredDetailUrls(
  spec: R2GallerySpec,
): Promise<string[] | null> {
  if (process.env.R2_GALLERY_DISCOVER === "0") {
    return null;
  }
  const cached = unstable_cache(
    () => discoverIndexedDetailUrls(spec, CACHED_MAX_DETAIL_SLOTS),
    [
      "r2-detail",
      spec.slugFolder,
      spec.filePrefix,
      String(CACHED_MAX_DETAIL_SLOTS),
    ],
    { revalidate: REVALIDATE_SEC },
  );
  try {
    const urls = await cached();
    return urls.length > 0 ? urls : null;
  } catch {
    return null;
  }
}

async function discoverIndexedVariantUrls(
  spec: R2GallerySpec,
  maxSlots: number,
): Promise<string[]> {
  const variantPrefix = spec.variantFilePrefix ?? spec.filePrefix;
  const variantMid = spec.variantSlug ?? "style";
  const urls = Array.from(
    { length: maxSlots },
    (_, i) =>
      `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/variants/${variantPrefix}-${variantMid}-${pad2(i + 1)}.webp`,
  );
  const ok = await Promise.all(urls.map((u) => headOk(u)));
  const out: string[] = [];
  for (let i = 0; i < maxSlots; i++) {
    if (ok[i]) out.push(urls[i]);
  }
  return out;
}

/**
 * Cached variant thumbnail URLs from live R2 (`{prefix}-{variantSlug}-01.webp` … gaps allowed).
 * Same env as gallery: `R2_GALLERY_DISCOVER=0` skips discovery (use catalog URLs).
 */
export async function getDiscoveredVariantUrls(
  spec: R2GallerySpec,
): Promise<string[] | null> {
  if (process.env.R2_GALLERY_DISCOVER === "0") {
    return null;
  }
  const variantPrefix = spec.variantFilePrefix ?? spec.filePrefix;
  const variantMid = spec.variantSlug ?? "style";
  const cached = unstable_cache(
    () => discoverIndexedVariantUrls(spec, CACHED_MAX_VARIANT_SLOTS),
    [
      "r2-variants",
      spec.slugFolder,
      spec.filePrefix,
      variantPrefix,
      variantMid,
      String(CACHED_MAX_VARIANT_SLOTS),
    ],
    { revalidate: REVALIDATE_SEC },
  );
  try {
    const urls = await cached();
    return urls.length > 0 ? urls : null;
  } catch {
    return null;
  }
}
