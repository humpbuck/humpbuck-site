import { prisma } from "@/lib/prisma";
import type { Product, SeriesSlug } from "@/lib/catalog";

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

function asSeriesSlug(v: string): SeriesSlug {
  if (v === "digitemp" || v === "tonneau" || v === "rd-astral") return v;
  return "digitemp";
}

async function getStaticProductsFallback(): Promise<Product[]> {
  return [];
}

function toProduct(row: CatalogProductRow, inventory: InventoryRow[]): Product {
  const gallery = parseArray<string>(row.galleryJson, []);
  const detail = parseArray<string>(row.detailJson, []);
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
    const lowStockThreshold = Math.max(0, inv?.lowStockThreshold ?? 5);
    return {
      id,
      label: v.label ? String(v.label) : "",
      image: v.image ? String(v.image) : "",
      inStock: quantity > 0 && v.inStock !== false,
      quantity,
      lowStockThreshold,
    };
  });
  const computedInStock =
    variantStock.length > 0 ? variantStock.some((v) => v.quantity > 0 && v.inStock !== false) : row.inStock;
  const computedStockQuantity =
    variantStock.length > 0
      ? variantStock.reduce((sum, v) => sum + v.quantity, 0)
      : 0;

  return {
    slug: row.slug,
    name: row.name,
    seriesSlug: asSeriesSlug(row.seriesSlug),
    categoryLabel: row.categoryLabel,
    shortDescription: row.shortDescription,
    description: row.description,
    price: Number.isFinite(row.price) ? row.price : 0,
    compareAtPrice: row.compareAtPrice ?? undefined,
    image: row.image || gallery[0] || "",
    images: gallery,
    galleryImages: gallery,
    detailImages: detail,
    promoVideo: promo,
    variantOptions: variantStock.filter((v) => v.id && v.label && v.image).map((v) => ({
      id: v.id,
      label: v.label,
      image: v.image,
      inStock: v.inStock,
      stockQuantity: v.quantity,
    })),
    highlights: highlights.filter((h) => typeof h === "string" && h.trim().length > 0),
    specs: specs
      .filter((s) => s.label && s.value)
      .map((s) => ({ label: String(s.label), value: String(s.value) })),
    inStock: computedInStock,
    stockQuantity: computedStockQuantity,
  };
}

/**
 * Frontend catalog source:
 * - Prefer admin-managed DB products (CatalogProduct).
 * - Return database catalog first and fail closed if the DB query is unavailable.
 */
export async function getMergedCatalogProducts(): Promise<Product[]> {
  try {
    const [dbRows, inventory] = await Promise.all([
      prisma.catalogProduct.findMany(),
      prisma.productInventory.findMany(),
    ]);
    if (dbRows.length === 0) return getStaticProductsFallback();
    return dbRows.map((row) => toProduct(row, inventory));
  } catch (e) {
    console.error("[catalog-db] failed to load CatalogProduct, fallback to static:", e);
    return getStaticProductsFallback();
  }
}

export async function getMergedCatalogProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    const [row, inventory] = await Promise.all([
      prisma.catalogProduct.findUnique({ where: { slug } }),
      prisma.productInventory.findMany({ where: { productSlug: slug } }),
    ]);
    if (row) return toProduct(row, inventory);
  } catch (e) {
    console.error("[catalog-db] failed to load CatalogProduct by slug, fallback to static:", e);
  }
  const fallback = await getStaticProductsFallback();
  return fallback.find((p) => p.slug === slug);
}
