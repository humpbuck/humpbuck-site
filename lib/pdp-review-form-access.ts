import { prisma } from "@/lib/prisma";
import { findEligibleOrderIdForProductReview } from "@/lib/review-eligibility-queries";
import { orderContainsProductSlug } from "@/lib/review-eligibility";

export type PdpReviewFormAccess =
  | { kind: "guest" }
  | { kind: "alreadyReviewed" }
  | { kind: "eligible"; orderId: string }
  | { kind: "confirmReceiptRequired" }
  | { kind: "signedInNoPurchase" };

/** Who may see the PDP review form and whether submission is allowed. */
export async function getPdpReviewFormAccess(
  userId: string | undefined,
  productSlug: string,
): Promise<PdpReviewFormAccess> {
  const slug = productSlug.trim();
  if (!slug) return { kind: "guest" };

  if (!userId) return { kind: "guest" };

  const orderId = await findEligibleOrderIdForProductReview(userId, slug);
  if (orderId) return { kind: "eligible", orderId };

  const shippedOrders = await prisma.order.findMany({
    where: {
      userId,
      status: "shipped",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, items: { select: { productSlug: true } } },
    take: 20,
  });
  for (const order of shippedOrders) {
    if (orderContainsProductSlug(order, slug)) {
      return { kind: "confirmReceiptRequired" };
    }
  }

  const hasReview = await prisma.productReview.findFirst({
    where: { userId, productSlug: slug },
    select: { id: true },
  });
  if (hasReview) return { kind: "alreadyReviewed" };

  return { kind: "signedInNoPurchase" };
}
