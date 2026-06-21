import { orderItemsFromOrder } from "@/lib/order-item-display";

/** Buyer may leave a review only after confirming receipt (`delivered`). */
const REVIEW_OK = new Set(["delivered"]);

export function orderStatusAllowsReview(status: string): boolean {
  return REVIEW_OK.has(status);
}

export function orderContainsProductSlug(
  order: unknown,
  productSlug: string,
): boolean {
  if (!order || typeof order !== "object") return false;
  const lines = orderItemsFromOrder(order as { items?: Array<{ productSlug: string }> });
  return lines.some((l) => l.slug === productSlug);
}
