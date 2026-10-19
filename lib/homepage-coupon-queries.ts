import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type HomepageFeaturedCoupon = {
  code: string;
};

function couponEndExclusive(endsAt: Date): Date {
  const end = new Date(endsAt);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

function isCouponCurrentlyValid(coupon: {
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  quantity: number;
  usedCount: number;
}): boolean {
  if (!coupon.isActive) return false;
  const now = new Date();
  if (now < coupon.startsAt || now >= couponEndExclusive(coupon.endsAt)) return false;
  if (coupon.usedCount >= coupon.quantity) return false;
  return true;
}

async function loadHomepageFeaturedCouponUncached(): Promise<HomepageFeaturedCoupon | null> {
  const coupon = await prisma.coupon
    .findFirst({ where: { homeFeatured: true } })
    .catch(() => null);
  if (!coupon || !isCouponCurrentlyValid(coupon)) return null;
  return { code: coupon.code };
}

const HOMEPAGE_COUPON_REVALIDATE_SECONDS = 60;

const getCachedHomepageFeaturedCoupon = unstable_cache(
  loadHomepageFeaturedCouponUncached,
  ["homepage-featured-coupon"],
  {
    tags: ["homepage-featured-coupon"],
    revalidate: HOMEPAGE_COUPON_REVALIDATE_SECONDS,
  },
);

/** Homepage coupon code — 60s cache; validity is re-checked on miss. */
export const getHomepageFeaturedCoupon = cache(
  async (): Promise<HomepageFeaturedCoupon | null> => {
    return getCachedHomepageFeaturedCoupon();
  },
);

/** Ensure at most one coupon is marked for the homepage prompt. */
export async function setCouponHomeFeatured(
  couponId: string,
  homeFeatured: boolean,
): Promise<void> {
  if (homeFeatured) {
    await prisma.$transaction([
      prisma.coupon.updateMany({
        where: { homeFeatured: true, id: { not: couponId } },
        data: { homeFeatured: false },
      }),
      prisma.coupon.update({
        where: { id: couponId },
        data: { homeFeatured: true },
      }),
    ]);
    return;
  }

  await prisma.coupon.update({
    where: { id: couponId },
    data: { homeFeatured: false },
  });
}
