/** Client-safe types and helpers (no Prisma). */

export type WholesaleListingRow = {
  id: string;
  slug: string;
  modelNumber: string;
  description: string;
  priceUsd: number;
  mediaUrls: string[];
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WholesaleListingClientRow = Pick<
  WholesaleListingRow,
  "id" | "slug" | "modelNumber" | "description" | "priceUsd" | "mediaUrls"
>;

export function toWholesaleListingClientRow(row: WholesaleListingRow): WholesaleListingClientRow {
  return {
    id: row.id,
    slug: row.slug,
    modelNumber: row.modelNumber,
    description: row.description,
    priceUsd: row.priceUsd,
    mediaUrls: row.mediaUrls,
  };
}

export type WholesaleListingsLabels = {
  listingsKicker: string;
  listingsTitle: string;
  listingsLead: string;
  listingsPrev: string;
  listingsNext: string;
  listingsPageTemplate: string;
  listingsModalFallbackTitle: string;
};

export type WholesaleListingInput = {
  slug: string;
  modelNumber: string;
  description: string;
  priceUsd: number;
  mediaUrls: string[];
  status: string;
  sortOrder: number;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i;

export function isWholesaleVideoUrl(url: string): boolean {
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

/** First image URL in a listing — used as the video slide / thumb poster. */
export function wholesaleListingPosterUrl(mediaUrls: string[]): string | null {
  for (const raw of mediaUrls) {
    const url = raw.trim();
    if (url && !isWholesaleVideoUrl(url)) return url;
  }
  return null;
}

/** Canonical wholesale listing slug: lowercase letters, digits, hyphens. */
export function normalizeWholesaleListingSlug(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function isWholesaleListingSlugValid(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,95}$/.test(slug);
}

export function wholesaleListingPublicPath(slug: string): string {
  const s = slug.trim();
  return `/wholesale/${encodeURIComponent(s)}`;
}

/** Numeric key from labels like "MODEL 006" — used for storefront sort (highest first). */
export function wholesaleModelNumberSortKey(modelNumber: string): number {
  const trimmed = modelNumber.trim();
  if (!trimmed) return -1;
  const matches = trimmed.match(/\d+/g);
  if (!matches?.length) return -1;
  const n = parseInt(matches[matches.length - 1]!, 10);
  return Number.isFinite(n) ? n : -1;
}

export function parseMediaJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Preserve textarea newlines; also break single-line numbered lists (1. … 2. …) onto separate lines. */
export function formatWholesaleDescriptionForDisplay(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes("\n")) return trimmed;
  if (!/^\d+\./.test(trimmed)) return trimmed;

  const parts = trimmed.split(/\s+(?=\d+\.)/);
  if (parts.length <= 1) return trimmed;
  return parts.join("\n");
}
