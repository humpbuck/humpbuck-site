import { prisma } from "@/lib/prisma";
import { getAllProducts, type Product, type SeriesSlug } from "@/lib/catalog";

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
 * - Keep static catalog as fallback for slugs not yet migrated.
 */
export async function getMergedCatalogProducts(): Promise<Product[]> {
  if (process.env.NODE_ENV !== "production") {
    return getAllProducts();
  }

  let dbRows: CatalogProductRow[] = [];
  try {
    dbRows = await prisma.catalogProduct.findMany({
      where: { status: "active" },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
  } catch (e) {
    console.error("[catalog-db] failed to load CatalogProduct, fallback to static:", e);
    return getAllProducts();
  }

  if (dbRows.length === 0) return getAllProducts();

  const dbProducts = dbRows.map(toProduct);
  const bySlug = new Map<string, Product>();
  for (const p of dbProducts) bySlug.set(p.slug, p);
  for (const p of getAllProducts()) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  return [...bySlug.values()];
}

export async function getMergedCatalogProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const list = await getMergedCatalogProducts();
  return list.find((p) => p.slug === slug);
}
