import type { ProductReview, ProductReviewAppend, User } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { userPublicDisplayName, type UserDisplayNameInput } from "@/lib/user-display-name";

export type ProductReviewWithUser = ProductReview & {
  user: Pick<User, "id" | "firstName" | "lastName" | "displayName" | "name" | "email"> | null;
  appends: ProductReviewAppend[];
  itemVariantLabel?: string | null;
};

async function loadProductReviewStatsUncached(
  productSlug: string,
): Promise<{
  reviewCount: number;
  ratingValue: number;
  fiveStarCount: number;
} | null> {
  const slug = productSlug?.trim() ?? "";
  if (!slug) return null;

  const ratings = await prisma.productReview.findMany({
    where: { productSlug: slug, status: "approved" },
    select: { rating: true },
  });
  if (ratings.length === 0) return null;

  let sum = 0;
  let fiveStarCount = 0;
  for (const r of ratings) {
    sum += r.rating;
    if (r.rating === 5) fiveStarCount += 1;
  }

  return {
    reviewCount: ratings.length,
    ratingValue: Math.round((sum / ratings.length) * 10) / 10,
    fiveStarCount,
  };
}

export async function getProductReviewStats(
  productSlug: string,
): Promise<{
  reviewCount: number;
  ratingValue: number;
  fiveStarCount: number;
} | null> {
  const slug = productSlug?.trim() ?? "";
  if (!slug) return null;

  return unstable_cache(
    () => loadProductReviewStatsUncached(slug),
    ["product-review-stats", slug],
    {
      tags: [`product-reviews-${slug}`],
    },
  )();
}

async function loadProductFiveStarReviewCountsUncached(
  productSlugs: readonly string[],
): Promise<Map<string, number>> {
  const slugs = [...new Set(productSlugs.map((s) => s.trim()).filter(Boolean))];
  const counts = new Map<string, number>();
  if (slugs.length === 0) return counts;

  for (const slug of slugs) counts.set(slug, 0);

  const rows = await prisma.productReview.findMany({
    where: {
      productSlug: { in: slugs },
      status: "approved",
      rating: 5,
    },
    select: { productSlug: true },
  });

  for (const row of rows) {
    counts.set(row.productSlug, (counts.get(row.productSlug) ?? 0) + 1);
  }

  return counts;
}

/** Batch lookup: count of 5-star reviews per product slug (missing slugs → 0). */
export async function getProductFiveStarReviewCounts(
  productSlugs: readonly string[],
): Promise<Map<string, number>> {
  const slugs = [...new Set(productSlugs.map((s) => s.trim()).filter(Boolean))].sort();
  if (slugs.length === 0) return new Map();

  return unstable_cache(
    () => loadProductFiveStarReviewCountsUncached(slugs),
    ["product-five-star-counts", slugs.join("|")],
    {
      tags: slugs.map((slug) => `product-reviews-${slug}`),
    },
  )();
}

async function loadProductReviewsWithUsersUncached(
  productSlug: string,
  take: number,
): Promise<ProductReviewWithUser[]> {
  const slug = productSlug?.trim() ?? "";
  if (!slug) return [];

  const reviews = await prisma.productReview.findMany({
    where: { productSlug: slug, status: "approved" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          name: true,
          email: true,
        },
      },
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

  const orderIds = [
    ...new Set(
      reviews.map((r) => r.orderId?.trim()).filter((id): id is string => Boolean(id)),
    ),
  ];
  const variantByOrderId = new Map<string, string>();
  if (orderIds.length > 0) {
    const snapshots = await prisma.orderItemSnapshot.findMany({
      where: { orderId: { in: orderIds }, productSlug: slug },
      select: { orderId: true, variantLabel: true },
    });
    for (const snap of snapshots) {
      const label = snap.variantLabel?.trim();
      if (label) variantByOrderId.set(snap.orderId, label);
    }
  }

  return reviews.map((r) => ({
    ...r,
    appends: byReviewId.get(r.id) ?? [],
    itemVariantLabel: r.orderId ? (variantByOrderId.get(r.orderId) ?? null) : null,
  }));
}

export async function getProductReviewsWithUsers(
  productSlug: string,
  take = 100,
): Promise<ProductReviewWithUser[]> {
  const slug = productSlug?.trim() ?? "";
  if (!slug) return [];

  return unstable_cache(
    () => loadProductReviewsWithUsersUncached(slug, take),
    ["product-reviews-with-users", slug, String(take)],
    {
      tags: [`product-reviews-${slug}`],
    },
  )();
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
  user?: (UserDisplayNameInput & { name?: string | null }) | null;
}): string {
  const fromUser = userPublicDisplayName(review.user, "");
  if (fromUser) return fromUser;

  const legacyName = review.user?.name?.trim();
  if (legacyName) return legacyName;

  const email = review.user?.email?.trim();
  if (email) return email;

  return "Verified buyer";
}

/** Compact public label, e.g. "Tiina T." */
export function reviewAuthorShortLabel(review: {
  user?: (UserDisplayNameInput & { name?: string | null }) | null;
}): string {
  const first = review.user?.firstName?.trim();
  if (first) {
    const last = review.user?.lastName?.trim();
    if (last) return `${first} ${last[0]}.`;
    return first;
  }

  const legacyName = review.user?.name?.trim();
  if (legacyName) {
    const parts = legacyName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]} ${parts[1]![0]}.`;
    return legacyName;
  }

  return reviewAuthorLabel(review);
}
