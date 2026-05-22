/** Client-safe types and helpers (no Prisma). */

export type WholesaleListingRow = {
  id: string;
  modelNumber: string;
  description: string;
  priceUsd: number;
  mediaUrls: string[];
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WholesaleListingInput = {
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
