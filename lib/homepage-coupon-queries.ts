import { connection } from "next/server";
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

/** Homepage coupon code — always read D1 on request (see `getSiteHomeContent`). */
export async function getHomepageFeaturedCoupon(): Promise<HomepageFeaturedCoupon | null> {
  await connection();
  return loadHomepageFeaturedCouponUncached();
}

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
