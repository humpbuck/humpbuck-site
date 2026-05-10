import { getProductBySlug } from "@/lib/catalog";
import { getMergedCatalogProductBySlug } from "@/lib/catalog-db";
import type { ValidatedLine } from "@/lib/order-lines";

async function hydrateOrderLine(
  line: Pick<ValidatedLine, "slug" | "qty" | "variantId" | "variantLabel"> & {
    name?: string;
    productName?: string;
    unitAmountCents?: number;
    unitPrice?: number;
    lineTotalCents?: number;
    lineTotal?: number;
  },
): Promise<ValidatedLine | null> {
  if (!line.slug || !Number.isFinite(line.qty) || line.qty < 1) return null;
  const qty = Math.max(1, Math.floor(line.qty));
  const product = getProductBySlug(line.slug) ?? (await getMergedCatalogProductBySlug(line.slug));
  const unitAmountCents =
    Number.isFinite(line.unitAmountCents) && line.unitAmountCents! >= 0
      ? Math.round(line.unitAmountCents!)
      : Number.isFinite(line.unitPrice)
        ? Math.round((line.unitPrice as number) * 100)
        : product
          ? Math.round(product.price * 100)
          : null;
  if (unitAmountCents == null) return null;

  const resolvedName =
    line.name?.trim() || line.productName?.trim() || product?.name || line.slug;
  const resolvedLineTotalCents =
    Number.isFinite(line.lineTotalCents) && line.lineTotalCents! >= 0
      ? Math.round(line.lineTotalCents!)
      : Number.isFinite(line.lineTotal)
        ? Math.round((line.lineTotal as number) * 100)
        : unitAmountCents * qty;

  return {
    slug: product?.slug ?? line.slug,
    name: resolvedName,
    qty,
    unitAmountCents,
    lineTotalCents: resolvedLineTotalCents,
    variantId: line.variantId,
    variantLabel: line.variantLabel,
  };
}

export async function parseOrderItemsJson(json: string): Promise<ValidatedLine[]> {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];

    const lines = await Promise.all(
      arr
        .filter(
          (x): x is Pick<ValidatedLine, "slug" | "qty" | "variantId" | "variantLabel"> & {
            name?: string;
            productName?: string;
            unitAmountCents?: number;
            unitPrice?: number;
            lineTotalCents?: number;
            lineTotal?: number;
          } =>
            x != null &&
            typeof x === "object" &&
            typeof (x as { slug?: unknown }).slug === "string" &&
            typeof (x as { qty?: unknown }).qty === "number",
        )
        .map((x) => hydrateOrderLine(x)),
    );

    return lines.filter((x): x is ValidatedLine => Boolean(x));
  } catch {
    return [];
  }
}

/** Lightweight version for inventory operations (only slug, qty, variantId). */
export function parseOrderItemsForInventory(
  json: string,
): { slug: string; qty: number; variantId?: string }[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is { slug: string; qty: number; variantId?: string } =>
        x != null &&
        typeof x === "object" &&
        typeof (x as { slug?: unknown }).slug === "string" &&
        typeof (x as { qty?: unknown }).qty === "number",
    ).map((l) => ({
      slug: l.slug,
      qty: l.qty,
      variantId: l.variantId,
    }));
  } catch {
    return [];
  }
}
