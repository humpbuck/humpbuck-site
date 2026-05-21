/**
 * Seed the database `CatalogProduct` table.
 *
 * Usage:
 *   npx tsx scripts/seed-catalog-products.ts
 *
 * - If `CatalogProduct` already has rows: upserts from merged DB view (inventory-aware),
 *   same as before.
 * - If the table is empty: loads `prisma/seed-data/catalog-products.snapshot.json`
 *   (commit that file after changes; refresh via `npm run db:export-catalog-snapshot`).
 *
 * Idempotent: safe to re-run.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { CatalogProduct } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { type Product, type ProductVariantOption, normalizeSeriesSlug } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

type CatalogProductSnapshot = Omit<CatalogProduct, "id" | "createdAt" | "updatedAt">;

function toJson<T>(value: T): string {
  return JSON.stringify(value);
}

function promoVideoJson(product: Product): string | null {
  if (!product.promoVideo) return null;
  return JSON.stringify(product.promoVideo);
}

async function upsertProduct(product: Product) {
  const variants = (product.variantOptions ?? []).map((v: ProductVariantOption) => ({
    id: v.id,
    label: v.label,
    image: v.image,
    inStock: v.inStock,
  }));

  const existing = await prisma.catalogProduct.findUnique({
    where: { slug: product.slug },
    select: { id: true },
  });

  const data = {
    slug: product.slug,
    name: product.name,
    seriesSlug: normalizeSeriesSlug(product.seriesSlug) || "digitemp",
    categoryLabel: product.categoryLabel,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    image: product.image,
    inStock: product.inStock,
    highlightsJson: toJson(product.highlights ?? []),
    specsJson: toJson(product.specs ?? []),
    galleryJson: toJson(product.galleryImages ?? product.images ?? []),
    detailJson: toJson(product.detailImages ?? []),
    variantsJson: toJson(variants),
    promoVideoJson: promoVideoJson(product),
  };

  if (existing) {
    await prisma.catalogProduct.update({
      where: { slug: product.slug },
      data,
    });
  } else {
    await prisma.catalogProduct.create({ data });
  }
}

async function upsertFromSnapshot(row: CatalogProductSnapshot) {
  const existing = await prisma.catalogProduct.findUnique({
    where: { slug: row.slug },
    select: { id: true },
  });
  if (existing) {
    await prisma.catalogProduct.update({
      where: { slug: row.slug },
      data: row,
    });
  } else {
    await prisma.catalogProduct.create({ data: row });
  }
}

async function main() {
  const merged = await getMergedCatalogProducts();
  if (merged.length > 0) {
    for (const product of merged) {
      await upsertProduct(product);
    }
    console.log(`Seeded ${merged.length} catalog product(s) from database (inventory merge).`);
    return;
  }

  const snapshotPath = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "catalog-products.snapshot.json",
  );
  let raw: string;
  try {
    raw = await readFile(snapshotPath, "utf8");
  } catch {
    console.error(
      `CatalogProduct is empty and no snapshot found at:\n  ${snapshotPath}\n` +
        `Export one from a machine with catalog data:\n  npm run db:export-catalog-snapshot`,
    );
    process.exit(1);
    return;
  }

  let snapshot: CatalogProductSnapshot[];
  try {
    snapshot = JSON.parse(raw) as CatalogProductSnapshot[];
  } catch (e) {
    console.error("Invalid catalog snapshot JSON:", e);
    process.exit(1);
    return;
  }

  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    console.error("Catalog snapshot is empty.");
    process.exit(1);
    return;
  }

  for (const row of snapshot) {
    if (!row?.slug) continue;
    await upsertFromSnapshot(row);
  }
  console.log(`Seeded ${snapshot.length} catalog product(s) from snapshot file.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
