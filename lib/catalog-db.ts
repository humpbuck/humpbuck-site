import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/catalog";
import { normalizeSeriesSlug } from "@/lib/catalog";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { parseDetailBlocksJson } from "@/lib/product-detail-blocks";
import { parseProductPromoVideo } from "@/lib/product-promo-video";

type CatalogProductRow = {
  slug: string;
  name: string;
  seriesSlug: string;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  oemOdmPrice: number | null;
  image: string;
  inStock: boolean;
  highlightsJson: string;
  specsJson: string;
  galleryJson: string;
  detailJson: string;
  variantsJson: string;
  promoVideoJson: string | null;
  categoryId: string | null;
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
  homeSpotlight: boolean;
  homeRecommended: boolean;
  homeRecommendedSort: number;
  homeFeatured: boolean;
  homeFeaturedSort: number;
  updatedAt?: Date;
};

type InventoryRow = {
  productSlug: string;
  variantId: string;
  quantity: number;
  lowStockThreshold: number;
};

function parseArray<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

/** Storefront has no bundled catalog; empty DB or failed query yields an empty list. */
function emptyStorefrontCatalog(): Promise<Product[]> {
  return Promise.resolve([]);
}

function toProduct(row: CatalogProductRow, inventory: InventoryRow[]): Product {
  const gallery = parseArray<string>(row.galleryJson, []);
  const detailBlocks = parseDetailBlocksJson(row.detailJson);
  const variants = parseArray<
    { id?: string; label?: string; image?: string; inStock?: boolean }
  >(row.variantsJson, []);
  const specs = parseArray<{ label?: string; value?: string }>(row.specsJson, []);
  const highlights = parseArray<string>(row.highlightsJson, []);
  const promoParsed = parseProductPromoVideo(row.promoVideoJson);
  const promo = promoParsed
    ? {
        src: promoParsed.src,
        poster: promoParsed.poster,
        videos: promoParsed.videos,
      }
    : undefined;

  const variantStock = variants.map((v) => {
    const id = v.id ? String(v.id) : "";
    const inv = inventory.find((r) => r.productSlug === row.slug && r.variantId === id);
    const quantity = Math.max(0, inv?.quantity ?? 0);
    return {
      id,
      label: v.label ? String(v.label) : "",
      image: v.image ? String(v.image) : "",
      inStock: quantity > 0 && v.inStock !== false,
      stockQuantity: quantity,
    };
  });
  const computedInStock =
    variantStock.length > 0 ? variantStock.some((v) => v.inStock) : row.inStock;

  return {
    slug: row.slug,
    name: row.name,
    seriesSlug: normalizeSeriesSlug(row.seriesSlug) || "digitemp",
    categoryLabel: row.categoryLabel ?? "",
    shortDescription: row.shortDescription,
    description: row.description,
    price: Number.isFinite(row.price) ? row.price : 0,
    compareAtPrice: row.compareAtPrice ?? undefined,
    oemOdmPrice:
      row.oemOdmPrice != null && Number.isFinite(row.oemOdmPrice)
        ? row.oemOdmPrice
        : undefined,
    image: gallery[0] || row.image || "",
    images: gallery,
    galleryImages: gallery,
    detailImages: detailBlocks.map((block) => block.image).filter(Boolean),
    detailBlocks,
    promoVideo: promo,
    variantOptions: variantStock.filter((v) => v.id && v.label && v.image).map((v) => ({
      id: v.id,
      label: v.label,
      image: v.image,
      inStock: v.inStock,
      stockQuantity: v.stockQuantity,
    })),
    highlights: highlights.filter((h) => typeof h === "string" && h.trim().length > 0),
    specs: specs
      .filter((s) => s.label || s.value)
      .map((s) => ({
        label: String(s.label ?? "").trim(),
        value: String(s.value ?? "").trim(),
      })),
    inStock: computedInStock,
    categoryId: row.categoryId?.trim() || undefined,
    storefrontCategory: row.storefrontCategory?.trim() || undefined,
    storefrontSubcategory: row.storefrontSubcategory?.trim() || undefined,
    storefrontSeries: row.storefrontSeries?.trim() || undefined,
    homeSpotlight: Boolean(row.homeSpotlight),
    homeRecommended: Boolean(row.homeRecommended),
    homeRecommendedSort: Number.isFinite(row.homeRecommendedSort)
      ? row.homeRecommendedSort
      : 0,
    homeFeatured: Boolean(row.homeFeatured),
    homeFeaturedSort: Number.isFinite(row.homeFeaturedSort)
      ? row.homeFeaturedSort
      : 0,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : undefined,
  };
}

async function loadMergedCatalogProductsUncached(): Promise<Product[]> {
  try {
    await ensureCatalogProductSchema();
    const [dbRows, inventory] = await Promise.all([
      prisma.catalogProduct.findMany(),
      prisma.productInventory.findMany(),
    ]);
    if (dbRows.length === 0) return emptyStorefrontCatalog();
    return dbRows.map((row) => toProduct(row as unknown as CatalogProductRow, inventory));
  } catch (e) {
    console.error("[catalog-db] Failed to load CatalogProduct; returning empty storefront catalog.", e);
    return emptyStorefrontCatalog();
  }
}

/** Uncached catalog load for scripts (seed, audits). */
export async function fetchMergedCatalogProducts(): Promise<Product[]> {
  return loadMergedCatalogProductsUncached();
}

async function fetchMergedCatalogProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    await ensureCatalogProductSchema();
    const [row, inventory] = await Promise.all([
      prisma.catalogProduct.findUnique({ where: { slug } }),
      prisma.productInventory.findMany({ where: { productSlug: slug } }),
    ]);
    if (row) return toProduct(row as unknown as CatalogProductRow, inventory);
  } catch (e) {
    console.error("[catalog-db] Failed to load CatalogProduct by slug:", slug, e);
  }
  return undefined;
}

const CATALOG_REVALIDATE_SECONDS = 60;

const getCachedMergedCatalogProducts = unstable_cache(
  loadMergedCatalogProductsUncached,
  ["merged-catalog-products"],
  {
    tags: ["catalog"],
    revalidate: CATALOG_REVALIDATE_SECONDS,
  },
);

/**
 * Frontend catalog source: admin-managed `CatalogProduct` + inventory.
 * Short-lived cache (60s) + `revalidateTag("catalog")` on admin product/inventory saves.
 * React `cache` dedupes within a single request (PDP page + sections).
 */
export const getMergedCatalogProducts = cache(async (): Promise<Product[]> => {
  return getCachedMergedCatalogProducts();
});

export const getMergedCatalogProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    const trimmed = slug.trim();
    if (!trimmed) return undefined;
    return unstable_cache(
      () => fetchMergedCatalogProductBySlug(trimmed),
      ["merged-catalog-product", trimmed],
      {
        tags: ["catalog", `catalog-product-${trimmed}`],
        revalidate: CATALOG_REVALIDATE_SECONDS,
      },
    )();
  },
);

/** Load catalog products by id, preserving the requested order. */
export async function getMergedCatalogProductsByIds(
  ids: string[],
): Promise<Product[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];
  try {
    await ensureCatalogProductSchema();
    const rows = await prisma.catalogProduct.findMany({
      where: { id: { in: unique }, status: { not: "archived" } },
    });
    const slugs = rows.map((r) => r.slug);
    const inventory =
      slugs.length === 0
        ? []
        : await prisma.productInventory.findMany({
            where: { productSlug: { in: slugs } },
          });
    const byId = new Map(
      rows.map((row) => [
        row.id,
        toProduct(row as unknown as CatalogProductRow, inventory),
      ]),
    );
    return unique
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p));
  } catch (e) {
    console.error("[catalog-db] Failed to load CatalogProduct by ids.", e);
    return [];
  }
}
