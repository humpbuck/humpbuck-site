import { isWholesaleVideoUrl } from "@/lib/wholesale-listing-shared";

const preloaded = new Set<string>();

/** Browser-side warm cache for R2 gallery URLs (safe to call repeatedly). */
export function preloadImageUrls(urls: readonly string[]) {
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || isWholesaleVideoUrl(url) || preloaded.has(url)) continue;
    preloaded.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
