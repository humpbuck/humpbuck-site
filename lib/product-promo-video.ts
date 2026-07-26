/**
 * Product showcase video — same model as watchsourcego:
 * admin stores explicit HTTPS / R2 URLs; storefront plays those URLs only.
 */

export type ProductPromoVideoStored = {
  /** Preferred list (watchsourcego-style). */
  videos?: string[];
  /** Legacy single URL; treated as videos[0] when `videos` is absent. */
  src?: string;
  poster?: string;
};

export type ProductPromoVideoNormalized = {
  videos: string[];
  /** First video URL — kept for older readers / video-tutorial fallback. */
  src: string;
  poster?: string;
};

function trimVideoUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => u.trim()).filter(Boolean);
}

/** Parse `promoVideoJson` from DB or admin payload into a clean video list. */
export function parseProductPromoVideo(
  raw: string | ProductPromoVideoStored | null | undefined,
): ProductPromoVideoNormalized | null {
  if (raw == null || raw === "") return null;

  let parsed: ProductPromoVideoStored;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as ProductPromoVideoStored;
    } catch {
      return null;
    }
  } else {
    parsed = raw;
  }

  const fromList = trimVideoUrls(parsed.videos);
  const fromSrc = parsed.src?.trim();
  const videos = fromList.length > 0 ? fromList : fromSrc ? [fromSrc] : [];
  if (videos.length === 0) return null;

  const poster = parsed.poster?.trim() || undefined;
  return { videos, src: videos[0]!, poster };
}

/** Shape written to `promoVideoJson` (includes legacy `src` for compatibility). */
export function serializeProductPromoVideo(
  input: ProductPromoVideoStored | null | undefined,
): string | null {
  const normalized = parseProductPromoVideo(input);
  if (!normalized) return null;
  return JSON.stringify({
    videos: normalized.videos,
    src: normalized.src,
    ...(normalized.poster ? { poster: normalized.poster } : {}),
  });
}
