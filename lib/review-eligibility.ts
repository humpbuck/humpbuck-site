import { orderItemsFromOrder } from "@/lib/order-item-display";

/** Paid / fulfillment — buyer may leave a product review. */
const REVIEW_OK = new Set(["paid", "processing", "shipped", "delivered"]);

export function orderStatusAllowsReview(status: string): boolean {
  return REVIEW_OK.has(status);
}

export function orderContainsProductSlug(
  order: { items?: Array<{ productSlug: string }> },
  productSlug: string,
): boolean {
  const lines = orderItemsFromOrder(order);
  return lines.some((l) => l.slug === productSlug);
}
