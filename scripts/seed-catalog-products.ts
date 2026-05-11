/**
 * Seed the database `CatalogProduct` table from the current static catalog.
 *
 * Usage:
 *   npx tsx scripts/seed-catalog-products.ts
 *
 * This script is intentionally idempotent: it upserts every static product by slug,
 * making the database the primary source while preserving the current catalog data.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import {
  getAllProducts,
  type Product,
  type ProductVariantOption,
  type SeriesSlug,
} from "@/lib/catalog";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function asSeriesSlug(value: string): SeriesSlug {
  if (value === "digitemp" || value === "tonneau" || value === "rd-astral") return value;
  return "digitemp";
}

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
    seriesSlug: asSeriesSlug(product.seriesSlug),
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

async function main() {
  const products = getAllProducts();
  for (const product of products) {
    await upsertProduct(product);
  }
  console.log(`Seeded ${products.length} catalog product(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
