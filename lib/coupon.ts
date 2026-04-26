import { prisma } from "@/lib/prisma";

export function normalizeCouponCode(input: string | null | undefined): string {
  return String(input ?? "")
    .trim()
    .toUpperCase();
}

function couponEndExclusive(endsAt: Date): Date {
  const d = new Date(endsAt);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export async function resolveCouponDiscount(params: {
  code: string | null | undefined;
  totalCents: number;
  now?: Date;
}): Promise<{
  ok: true;
  couponId: string | null;
  code: string | null;
  discountCents: number;
} | {
  ok: false;
  error: string;
}> {
  const code = normalizeCouponCode(params.code);
  if (!code) {
    return { ok: true, couponId: null, code: null, discountCents: 0 };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "Coupon code is invalid or inactive." };
  }

  const now = params.now ?? new Date();
  const endExclusive = couponEndExclusive(coupon.endsAt);
  if (now < coupon.startsAt) {
    return { ok: false, error: "This coupon is not active yet." };
  }
  if (now >= endExclusive) {
    return { ok: false, error: "This coupon has expired." };
  }
  if (coupon.usedCount >= coupon.quantity) {
    return { ok: false, error: "This coupon is no longer available." };
  }

  const totalCents = Math.max(0, Math.floor(params.totalCents));
  const discountCents = Math.min(totalCents, Math.max(0, coupon.amountOffCents));
  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    discountCents,
  };
}
