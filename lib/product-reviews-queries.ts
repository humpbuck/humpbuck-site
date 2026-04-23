import type { ProductReview, ProductReviewAppend, User } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProductReviewWithUser = ProductReview & {
  user: Pick<User, "id" | "name" | "email" | "image">;
  appends: ProductReviewAppend[];
};

export async function getProductReviewsWithUsers(
  productSlug: string,
  take = 50,
): Promise<ProductReviewWithUser[]> {
  noStore();
  const slug = productSlug?.trim() ?? "";
  if (!slug) return [];

  const reviews = await prisma.productReview.findMany({
    where: { productSlug: slug },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: {
      user: { select: { name: true, image: true, email: true, id: true } },
    },
  });
  if (reviews.length === 0) {
    return [];
  }
  const reviewIds = reviews.map((r) => r.id);
  const appends = await prisma.productReviewAppend.findMany({
    where: { reviewId: { in: reviewIds } },
    orderBy: { createdAt: "asc" },
  });
  const byReviewId = new Map<string, typeof appends>();
  for (const a of appends) {
    const list = byReviewId.get(a.reviewId) ?? [];
    list.push(a);
    byReviewId.set(a.reviewId, list);
  }
  return reviews.map((r) => ({
    ...r,
    appends: byReviewId.get(r.id) ?? [],
  }));
}

export function parseReviewImageUrls(json: string): string[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function reviewAuthorLabel(review: {
  user: { name: string | null; email: string | null };
}): string {
  const n = review.user.name?.trim();
  if (n) return n;
  const em = review.user.email?.trim();
  if (em) {
    const [local] = em.split("@");
    return local || "Verified buyer";
  }
  return "Verified buyer";
}
