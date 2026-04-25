import type { ValidatedLine } from "@/lib/order-lines";

export function parseOrderItemsJson(json: string): ValidatedLine[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is ValidatedLine =>
        x != null &&
        typeof x === "object" &&
        typeof (x as ValidatedLine).slug === "string" &&
        typeof (x as ValidatedLine).qty === "number",
    );
  } catch {
    return [];
  }
}

/** Lightweight version for inventory operations (only slug, qty, variantId). */
export function parseOrderItemsForInventory(
  json: string,
): { slug: string; qty: number; variantId?: string }[] {
  return parseOrderItemsJson(json).map((l) => ({
    slug: l.slug,
    qty: l.qty,
    variantId: l.variantId,
  }));
}
