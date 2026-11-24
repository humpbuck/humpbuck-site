import "server-only";

import {
  getMergedCatalogProductBySlug,
  getMergedCatalogProducts,
} from "@/lib/catalog-db";
import type { Product } from "@/lib/catalog";
import {
  matchProductByLegacyCompoundSlug,
  productHref,
} from "@/lib/product-path";

/** Resolve PDP product by current slug, or legacy compound slug after rename. */
export async function resolveProductForPdpSlug(
  pathSlug: string,
): Promise<Product | null> {
  const exact = await getMergedCatalogProductBySlug(pathSlug);
  if (exact) return exact;

  try {
    const all = await getMergedCatalogProducts();
    return matchProductByLegacyCompoundSlug(pathSlug, all);
  } catch (err) {
    console.error("[product-path] legacy slug resolve failed", err);
    return null;
  }
}

/** Canonical PDP path (`/products/{category}/{slug}`) for a catalog slug. */
export async function productHrefForSlug(pathSlug: string): Promise<string> {
  const product = await resolveProductForPdpSlug(pathSlug);
  return productHref(product ?? { slug: pathSlug });
}
