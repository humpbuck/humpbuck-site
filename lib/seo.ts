import { mechanicalHeroWebpUrl } from "@/lib/r2";

/**
 * Canonical site origin for metadata, sitemap, and JSON-LD.
 * Set `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` on Vercel to
 * `https://www.humpbuck.com` (no trailing slash).
 */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

/** Resolve product or asset URL for og:image (R2 URLs pass through). */
export function absoluteOgImageUrl(url: string | undefined): string {
  if (!url) return mechanicalHeroWebpUrl();
  if (/^https?:\/\//i.test(url)) return url;
  const base = getSiteUrl();
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

export const defaultOgImage = {
  url: mechanicalHeroWebpUrl(),
  width: 1200,
  height: 630,
  alt: "HUMPBUCK — skeleton mechanical watch movement with visible gears",
} as const;
