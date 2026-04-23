import { parseOrderItemsJson } from "@/lib/parse-order-items";

/** Paid / fulfillment — buyer may leave a product review. */
const REVIEW_OK = new Set(["paid", "processing", "shipped"]);

export function orderStatusAllowsReview(status: string): boolean {
  return REVIEW_OK.has(status);
}

export function orderContainsProductSlug(
  itemsJson: string,
  productSlug: string,
): boolean {
  return parseOrderItemsJson(itemsJson).some((l) => l.slug === productSlug);
}
