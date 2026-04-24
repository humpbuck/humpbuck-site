/**
 * Heuristic: URLs served from R2 public dev / custom public base.
 * Use with `next/image` `unoptimized` so the browser fetches the object URL directly
 * instead of `/_next/image?url=...`, which can intermittently 5xx on some webp and
 * previously fired our `onError` handlers, shrinking the gallery to one slide.
 */
export function isR2PublicObjectUrl(url: string): boolean {
  const s = url.trim();
  if (!s.startsWith("http")) return false;
  if (s.includes(".r2.dev") || s.includes("r2.cloudflarestorage.com")) {
    return true;
  }
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim().replace(/\/$/, "");
  if (base && s.startsWith(base)) return true;
  return false;
}
