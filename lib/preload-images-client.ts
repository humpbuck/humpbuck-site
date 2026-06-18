const preloaded = new Set<string>();

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i;

function isVideoUrl(url: string): boolean {
  const s = url.trim();
  if (!s) return false;
  if (VIDEO_EXT.test(s)) return true;
  try {
    const u = new URL(s);
    return u.pathname.toLowerCase().includes("/video/");
  } catch {
    return false;
  }
}

/** Browser-side warm cache for R2 gallery URLs (safe to call repeatedly). */
export function preloadImageUrls(urls: readonly string[]) {
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || isVideoUrl(url) || preloaded.has(url)) continue;
    preloaded.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}
