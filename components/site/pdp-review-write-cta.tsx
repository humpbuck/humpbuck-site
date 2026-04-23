import Link from "next/link";
import { getPdpWriteReviewCta } from "@/lib/pdp-review-cta";

/**
 * On PDP: if the buyer has a reviewable, not-yet-reviewed line item for this product, show “Write a review”.
 * Pass `userId` from the parent (same `auth()` as the page) to avoid a second session lookup.
 */
export async function PdpReviewWriteCta({
  productSlug,
  userId,
}: {
  productSlug: string;
  userId: string | undefined;
}) {
  if (!userId) return null;
  let cta: { orderId: string } | null;
  try {
    cta = await getPdpWriteReviewCta(userId, productSlug);
  } catch (err) {
    console.error("[PdpReviewWriteCta] failed", err);
    return null;
  }
  if (!cta) return null;
  return (
    <p className="text-sm text-ink/90">
      <Link
        href={`/account/orders/${cta.orderId}/review/${encodeURIComponent(productSlug)}`}
        className="font-semibold underline-offset-4 hover:underline"
      >
        Write a review
      </Link>{" "}
      <span className="text-muted">(you have a completed purchase for this item)</span>
    </p>
  );
}
