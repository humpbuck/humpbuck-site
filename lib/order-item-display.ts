import type { ValidatedLine } from "@/lib/order-lines";

type OrderItemSnapshotLike = {
  productSlug: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantLabel: string | null;
  variantImage: string | null;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export function orderItemsFromSnapshotRows(
  rows: OrderItemSnapshotLike[] | null | undefined,
): ValidatedLine[] {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    slug: row.productSlug,
    name: row.productName,
    qty: Math.max(1, Math.floor(row.qty || 1)),
    unitAmountCents: Math.max(0, Math.round(row.unitPriceCents || 0)),
    lineTotalCents: Math.max(0, Math.round(row.lineTotalCents || 0)),
    variantId: row.variantId ?? undefined,
    variantLabel: row.variantLabel ?? undefined,
    variantImage: row.variantImage ?? undefined,
  }));
}

export function orderItemsFromOrder(order: {
  items?: Array<OrderItemSnapshotLike>;
}): ValidatedLine[] {
  return orderItemsFromSnapshotRows(order.items);
}

export function orderLineSnapshotJson(line: ValidatedLine): string | null {
  return JSON.stringify({
    slug: line.slug,
    name: line.name,
    qty: line.qty,
    unitAmountCents: line.unitAmountCents,
    lineTotalCents: line.lineTotalCents,
    variantId: line.variantId,
    variantLabel: line.variantLabel,
    variantImage: line.variantImage,
  });
}
