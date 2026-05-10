import { parseOrderItemsJson } from "@/lib/parse-order-items";

/** Paid / fulfillment — buyer may leave a product review. */
const REVIEW_OK = new Set(["paid", "processing", "shipped", "delivered"]);

export function orderStatusAllowsReview(status: string): boolean {
  return REVIEW_OK.has(status);
}

export async function orderContainsProductSlug(
  itemsJson: string,
  productSlug: string,
): Promise<boolean> {
  const lines = await parseOrderItemsJson(itemsJson);
  return lines.some((l) => l.slug === productSlug);
}
