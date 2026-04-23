import { prisma } from "@/lib/prisma";
import { orderContainsProductSlug, orderStatusAllowsReview } from "@/lib/review-eligibility";

/**
 * If the buyer can still start a first review (verified order line, not yet reviewed) — PDP “Write a review”.
 */
export async function getPdpWriteReviewCta(
  userId: string,
  productSlug: string,
): Promise<{ orderId: string } | null> {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: ["paid", "processing", "shipped"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, itemsJson: true, status: true },
  });
  for (const o of orders) {
    if (!orderStatusAllowsReview(o.status)) continue;
    if (!orderContainsProductSlug(o.itemsJson, productSlug)) continue;
    const existing = await prisma.productReview.findUnique({
      where: {
        userId_orderId_productSlug: {
          userId,
          orderId: o.id,
          productSlug,
        },
      },
    });
    if (!existing) return { orderId: o.id };
  }
  return null;
}
