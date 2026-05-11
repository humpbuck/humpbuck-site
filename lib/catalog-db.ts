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

function toProduct(row: CatalogProductRow): Product {
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
    variantOptions: variants
      .filter((v) => v.id && v.label && v.image)
      .map((v) => ({
        id: String(v.id),
        label: String(v.label),
        image: String(v.image),
        inStock: v.inStock !== false,
      })),
    highlights: highlights.filter((h) => typeof h === "string" && h.trim().length > 0),
    specs: specs
      .filter((s) => s.label && s.value)
      .map((s) => ({ label: String(s.label), value: String(s.value) })),
    inStock: row.inStock,
  };
}

/**
 * Frontend catalog source:
 * - Prefer admin-managed DB products (CatalogProduct).
 * - Return database catalog first and fail closed if the DB query is unavailable.
 */
export async function getMergedCatalogProducts(): Promise<Product[]> {
  try {
    const dbRows = await prisma.catalogProduct.findMany();
    if (dbRows.length === 0) return getStaticProductsFallback();
    return dbRows.map(toProduct);
  } catch (e) {
    console.error("[catalog-db] failed to load CatalogProduct, fallback to static:", e);
    return getStaticProductsFallback();
  }
}

export async function getMergedCatalogProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    const row = await prisma.catalogProduct.findUnique({ where: { slug } });
    if (row) return toProduct(row);
  } catch (e) {
    console.error("[catalog-db] failed to load CatalogProduct by slug, fallback to static:", e);
  }
  const fallback = await getStaticProductsFallback();
  return fallback.find((p) => p.slug === slug);
}
