import { prisma } from "@/lib/prisma";
import {
  isWholesaleListingSlugValid,
  normalizeWholesaleListingSlug,
  parseMediaJson,
  type WholesaleListingInput,
  type WholesaleListingRow,
} from "@/lib/wholesale-listing-shared";

export type { WholesaleListingInput, WholesaleListingRow } from "@/lib/wholesale-listing-shared";
export {
  isWholesaleListingSlugValid,
  isWholesaleVideoUrl,
  normalizeWholesaleListingSlug,
  parseMediaJson,
  wholesaleListingPublicPath,
} from "@/lib/wholesale-listing-shared";

function rowFromDb(row: {
  id: string;
  slug: string;
  modelNumber: string;
  description: string;
  priceUsd: number;
  mediaJson: string;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): WholesaleListingRow {
  return {
    id: row.id,
    slug: row.slug,
    modelNumber: row.modelNumber,
    description: row.description,
    priceUsd: row.priceUsd,
    mediaUrls: parseMediaJson(row.mediaJson),
    status: row.status,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function cleanWholesaleListingSlug(input: string): string | null {
  const slug = normalizeWholesaleListingSlug(input);
  if (!isWholesaleListingSlugValid(slug)) return null;
  return slug;
}

export async function listActiveWholesaleListings(): Promise<WholesaleListingRow[]> {
  const rows = await prisma.wholesaleListing.findMany({
    where: { status: "active" },
    /** Newest daily stock first — `updatedAt` bumps on each admin save. */
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(rowFromDb);
}

export async function getActiveWholesaleListingBySlug(
  slug: string,
): Promise<WholesaleListingRow | null> {
  const cleaned = cleanWholesaleListingSlug(slug);
  if (!cleaned) return null;
  const row = await prisma.wholesaleListing.findFirst({
    where: { slug: cleaned, status: "active" },
  });
  return row ? rowFromDb(row) : null;
}

export async function listWholesaleListingsAdmin(): Promise<WholesaleListingRow[]> {
  const rows = await prisma.wholesaleListing.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(rowFromDb);
}

function cleanMediaUrls(urls: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const s = raw.trim();
    if (!s || seen.has(s)) continue;
    if (!/^https?:\/\//i.test(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out.slice(0, 24);
}

function prepareInput(input: WholesaleListingInput): WholesaleListingInput | null {
  const slug = cleanWholesaleListingSlug(input.slug);
  if (!slug) return null;
  return {
    slug,
    modelNumber: input.modelNumber.trim().slice(0, 96),
    description: input.description.trim().slice(0, 4000),
    priceUsd: Number.isFinite(input.priceUsd) ? Math.max(0, input.priceUsd) : 0,
    mediaUrls: cleanMediaUrls(input.mediaUrls),
    status: input.status === "archived" ? "archived" : "active",
    sortOrder: Number.isFinite(input.sortOrder) ? Math.round(input.sortOrder) : 0,
  };
}

export async function createWholesaleListing(
  input: WholesaleListingInput,
): Promise<WholesaleListingRow> {
  const data = prepareInput(input);
  if (!data || data.mediaUrls.length === 0) {
    throw new Error("INVALID_WHOLESALE_LISTING");
  }
  const row = await prisma.wholesaleListing.create({
    data: {
      slug: data.slug,
      modelNumber: data.modelNumber,
      description: data.description,
      priceUsd: data.priceUsd,
      mediaJson: JSON.stringify(data.mediaUrls),
      status: data.status,
      sortOrder: data.sortOrder,
    },
  });
  return rowFromDb(row);
}

export async function updateWholesaleListing(
  id: string,
  input: WholesaleListingInput,
): Promise<WholesaleListingRow | null> {
  const existing = await prisma.wholesaleListing.findUnique({ where: { id } });
  if (!existing) return null;
  const data = prepareInput(input);
  if (!data || data.mediaUrls.length === 0) {
    throw new Error("INVALID_WHOLESALE_LISTING");
  }
  const row = await prisma.wholesaleListing.update({
    where: { id },
    data: {
      slug: data.slug,
      modelNumber: data.modelNumber,
      description: data.description,
      priceUsd: data.priceUsd,
      mediaJson: JSON.stringify(data.mediaUrls),
      status: data.status,
      sortOrder: data.sortOrder,
    },
  });
  return rowFromDb(row);
}

export async function deleteWholesaleListing(id: string): Promise<boolean> {
  const existing = await prisma.wholesaleListing.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.wholesaleListing.delete({ where: { id } });
  return true;
}

export async function saveWholesaleListingOrder(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.map((x) => x.trim()).filter(Boolean))];
  await prisma.$transaction(
    unique.map((id, index) =>
      prisma.wholesaleListing.updateMany({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
}
