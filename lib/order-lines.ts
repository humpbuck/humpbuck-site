import { isVariantAvailableForSale } from "@/lib/catalog";
import type { CartLine } from "@/lib/cart-types";
import { getMergedCatalogProductBySlug } from "@/lib/catalog-db";

const CART_QTY_MAX = 9999;

export type ValidatedLine = {
  slug: string;
  name: string;
  qty: number;
  unitAmountCents: number;
  lineTotalCents: number;
  variantId?: string;
  variantLabel?: string;
  variantImage?: string;
};

export async function validateCartLines(items: CartLine[]): Promise<{
  lines: ValidatedLine[];
  totalCents: number;
}> {
  const lines: ValidatedLine[] = [];
  let totalCents = 0;

  for (const item of items) {
    if (!item.slug || item.qty < 1 || item.qty > CART_QTY_MAX) {
      throw new Error("Invalid cart line");
    }
    const product = await getMergedCatalogProductBySlug(item.slug);
    if (!product || !isVariantAvailableForSale(product, item.variantId)) {
      throw new Error(`Unavailable: ${item.slug}`);
    }
    const unitAmountCents = Math.round(product.price * 100);
    const lineTotalCents = unitAmountCents * item.qty;
    totalCents += lineTotalCents;
    lines.push({
      slug: product.slug,
      name: product.name,
      qty: item.qty,
      unitAmountCents,
      lineTotalCents,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      variantImage: item.variantImage,
    });
  }

  return { lines, totalCents };
}
