import { prisma } from "@/lib/prisma";
import {
  parseMediaJson,
  type WholesaleListingInput,
  type WholesaleListingRow,
} from "@/lib/wholesale-listing-shared";

export type { WholesaleListingInput, WholesaleListingRow } from "@/lib/wholesale-listing-shared";
export { isWholesaleVideoUrl, parseMediaJson } from "@/lib/wholesale-listing-shared";

function rowFromDb(row: {
  id: string;
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

export async function listActiveWholesaleListings(): Promise<WholesaleListingRow[]> {
  const rows = await prisma.wholesaleListing.findMany({
    where: { status: "active" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(rowFromDb);
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

export async function createWholesaleListing(input: WholesaleListingInput): Promise<WholesaleListingRow> {
  const row = await prisma.wholesaleListing.create({
    data: {
      modelNumber: input.modelNumber.trim().slice(0, 96),
      description: input.description.trim().slice(0, 4000),
      priceUsd: Number.isFinite(input.priceUsd) ? Math.max(0, input.priceUsd) : 0,
      mediaJson: JSON.stringify(cleanMediaUrls(input.mediaUrls)),
      status: input.status === "archived" ? "archived" : "active",
      sortOrder: Number.isFinite(input.sortOrder) ? Math.round(input.sortOrder) : 0,
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
  const row = await prisma.wholesaleListing.update({
    where: { id },
    data: {
      modelNumber: input.modelNumber.trim().slice(0, 96),
      description: input.description.trim().slice(0, 4000),
      priceUsd: Number.isFinite(input.priceUsd) ? Math.max(0, input.priceUsd) : 0,
      mediaJson: JSON.stringify(cleanMediaUrls(input.mediaUrls)),
      status: input.status === "archived" ? "archived" : "active",
      sortOrder: Number.isFinite(input.sortOrder) ? Math.round(input.sortOrder) : 0,
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
