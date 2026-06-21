import { findEligibleOrderIdForProductReview } from "@/lib/review-eligibility-queries";

/**
 * If the buyer can still start a review (delivered order for this product, not yet reviewed).
 */
export async function getPdpWriteReviewCta(
  userId: string,
  productSlug: string,
): Promise<{ orderId: string } | null> {
  const orderId = await findEligibleOrderIdForProductReview(userId, productSlug);
  if (!orderId) return null;
  return { orderId };
}
