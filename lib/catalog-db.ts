import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_ISR_SECONDS } from "@/lib/storefront-revalidate";
import type { Product } from "@/lib/catalog";
import { normalizeSeriesSlug } from "@/lib/catalog";
import { parseDetailBlocksJson } from "@/lib/product-detail-blocks";

type CatalogProductRow = {
  slug: string;
  name: string;
  seriesSlug: string;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  inStock: boolean;
  highlightsJson: string;
  specsJson: string;
  galleryJson: string;
  detailJson: string;
  variantsJson: string;
  promoVideoJson: string | null;
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
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
  const detail = parseArray<string>(row.detailJson, []);
  const detailBlocks = parseDetailBlocksJson(row.detailJson);
  const variants = parseArray<
    { id?: string; label?: string; image?: string; inStock?: boolean }
  >(row.variantsJson, []);
  const specs = parseArray<{ label?: string; value?: string }>(row.specsJson, []);
  const highlights = parseArray<string>(row.highlightsJson, []);
  const promo = row.promoVideoJson
    ? (() => {
        try {
          const v = JSON.parse(row.promoVideoJson) as { src?: string; poster?: string };
          return v.src ? { src: v.src, poster: v.poster } : undefined;
        } catch {
          return undefined;
        }
      })()
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
    image: row.image || gallery[0] || "",
    images: gallery,
    galleryImages: gallery,
    detailImages: detailBlocks.length > 0 ? detailBlocks.map((block) => block.image) : detail,
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
    storefrontCategory: row.storefrontCategory?.trim() || undefined,
    storefrontSubcategory: row.storefrontSubcategory?.trim() || undefined,
    storefrontSeries: row.storefrontSeries?.trim() || undefined,
  };
}

async function fetchMergedCatalogProducts(): Promise<Product[]> {
  try {
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

async function fetchMergedCatalogProductBySlug(slug: string): Promise<Product | undefined> {
  try {
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

const getCachedMergedCatalogProducts = unstable_cache(
  fetchMergedCatalogProducts,
  ["merged-catalog-products"],
  {
    revalidate: STOREFRONT_ISR_SECONDS,
    tags: ["catalog"],
  },
);

/**
 * Frontend catalog source: admin-managed `CatalogProduct` + inventory.
 * Cached ~300s when non-empty; admin saves call `revalidateCatalogStorefront`.
 * Empty results are always refetched so a stale empty cache cannot hide new products.
 */
export async function getMergedCatalogProducts(): Promise<Product[]> {
  const products = await getCachedMergedCatalogProducts();
  if (products.length > 0) {
    return products;
  }
  return fetchMergedCatalogProducts();
}

export async function getMergedCatalogProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  return unstable_cache(
    () => fetchMergedCatalogProductBySlug(slug),
    ["merged-catalog-product", slug],
    {
      revalidate: STOREFRONT_ISR_SECONDS,
      tags: ["catalog", `catalog-product-${slug}`],
    },
  )();
}
