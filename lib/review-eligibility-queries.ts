import { prisma } from "@/lib/prisma";
import {
  orderContainsProductSlug,
  orderStatusAllowsReview,
} from "@/lib/review-eligibility";

const REVIEW_ORDER_STATUSES = ["delivered"] as const;

/** Most recent delivered order for this product that does not yet have a buyer review. */
export async function findEligibleOrderIdForProductReview(
  userId: string,
  productSlug: string,
): Promise<string | null> {
  const slug = productSlug.trim();
  if (!slug) return null;

  const reviewedOrderIds = new Set(
    (
      await prisma.productReview.findMany({
        where: { userId, productSlug: slug, orderId: { not: null } },
        select: { orderId: true },
      })
    )
      .map((r) => r.orderId)
      .filter((id): id is string => Boolean(id)),
  );

  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: [...REVIEW_ORDER_STATUSES] },
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      items: { select: { productSlug: true } },
    },
  });

  for (const order of orders) {
    if (reviewedOrderIds.has(order.id)) continue;
    if (!orderStatusAllowsReview(order.status)) continue;
    if (!orderContainsProductSlug(order, slug)) continue;
    return order.id;
  }
  return null;
}
