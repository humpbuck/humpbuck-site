export const PRODUCT_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export type ProductReviewStatus = (typeof PRODUCT_REVIEW_STATUSES)[number];

export function isProductReviewStatus(value: string): value is ProductReviewStatus {
  return (PRODUCT_REVIEW_STATUSES as readonly string[]).includes(value);
}
