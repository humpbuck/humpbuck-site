import { revalidateTag } from "next/cache";

/** Bust cached PDP review lists after buyer or admin review changes. */
export function revalidateProductReviews(productSlug: string): void {
  const slug = productSlug.trim();
  if (!slug) return;
  revalidateTag(`product-reviews-${slug}`, { expire: 0 });
}
