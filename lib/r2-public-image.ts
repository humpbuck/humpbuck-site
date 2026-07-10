/**
 * Heuristic: URLs served from R2 public dev / custom public base.
 * Used by `StorefrontImage` (and avatar helpers) so the browser fetches the object URL
 * directly instead of `/_next/image?url=...`, which can intermittently 5xx on some webp and
 * previously fired our `onError` handlers, shrinking the gallery to one slide.
 */
export function isR2PublicObjectUrl(url: string): boolean {
  const s = url.trim();
  if (!s.startsWith("http")) return false;
  if (
    s.includes(".r2.dev") ||
    s.includes("r2.cloudflarestorage.com") ||
    s.includes("assets.humpbuck.com")
  ) {
    return true;
  }
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim().replace(/\/$/, "");
  if (base && s.startsWith(base)) return true;
  return false;
}

/**
 * Append `?v=` for R2 URLs without one so browser/CDN refetch after same-path overwrites.
 * Skips URLs that already include `v=` (e.g. admin-entered `?v=2`).
 */
export function withImageCacheRevision(url: string, revision: string | null): string {
  const trimmed = url.trim();
  if (!trimmed || !revision) return trimmed;
  if (/[?&]v=/.test(trimmed)) return trimmed;
  if (!isR2PublicObjectUrl(trimmed)) return trimmed;
  const sep = trimmed.includes("?") ? "&" : "?";
  const token = revision.replace(/\D/g, "").slice(0, 14) || revision;
  return `${trimmed}${sep}v=${encodeURIComponent(token)}`;
}
