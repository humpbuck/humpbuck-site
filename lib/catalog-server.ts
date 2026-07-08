import "server-only";

import type { Product } from "@/lib/catalog";
import { normalizeSeriesSlug } from "@/lib/catalog";

const HOME_FEATURED_SALES_RANK: Record<string, number> = {
  "digitemp-2301": 1,
  "digitemp-2412m": 2,
  "rm-m01": 3,
  "rm-m02": 4,
  "rm-m09": 5,
  "rm-m08": 6,
  "rd-excalibur01": 7,
  "rm-m10": 8,
  "rm-m07": 9,
  "rm-m06": 10,
  "rm-m05": 11,
  "rm-m04": 12,
  "rm-m03": 13,
};

const HOME_FEATURED_FALLBACK_RANK = 999;

export async function getHomeFeaturedProducts(limit = 12): Promise<Product[]> {
  const { getMergedCatalogProducts } = await import("@/lib/catalog-db");
  const rank = (slug: string) => HOME_FEATURED_SALES_RANK[slug] ?? HOME_FEATURED_FALLBACK_RANK;
  return (await getMergedCatalogProducts())
    .sort((a, b) => {
      const d = rank(a.slug) - rank(b.slug);
      return d !== 0 ? d : a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { getMergedCatalogProductBySlug } = await import("@/lib/catalog-db");
  return getMergedCatalogProductBySlug(slug);
}

export async function getProductsBySeries(seriesSlug: string): Promise<Product[]> {
  const normalized = normalizeSeriesSlug(seriesSlug);
  const { getMergedCatalogProducts } = await import("@/lib/catalog-db");
  return (await getMergedCatalogProducts()).filter(
    (p) => normalizeSeriesSlug(p.seriesSlug) === normalized,
  );
}
