import { prisma } from "@/lib/prisma";

type AttributionInput = {
  couponId?: string | null;
  affiliatePid?: string | null;
  buyerUserId?: string | null;
  buyerEmail?: string | null;
};

function normalizeEmail(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

function isSelfPurchase(params: {
  buyerUserId?: string | null;
  buyerEmail?: string | null;
  affiliateUserId?: string | null;
  affiliateEmail?: string | null;
}): boolean {
  const buyerId = String(params.buyerUserId ?? "").trim();
  const affiliateId = String(params.affiliateUserId ?? "").trim();
  if (buyerId && affiliateId && buyerId === affiliateId) return true;
  const buyerEmail = normalizeEmail(params.buyerEmail);
  const affiliateEmail = normalizeEmail(params.affiliateEmail);
  return Boolean(buyerEmail && affiliateEmail && buyerEmail === affiliateEmail);
}

export async function resolveAffiliateAttribution(
  input: AttributionInput,
): Promise<{
  affiliateId: string | null;
  affiliatePid: string | null;
  source: "coupon" | "pid" | null;
}> {
  if (input.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: input.couponId },
      select: {
        affiliateId: true,
        affiliate: {
          select: {
            pid: true,
            blacklist: true,
            userId: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    if (
      isSelfPurchase({
        buyerUserId: input.buyerUserId,
        buyerEmail: input.buyerEmail,
        affiliateUserId: coupon?.affiliate?.userId ?? null,
        affiliateEmail: coupon?.affiliate?.user?.email ?? null,
      })
    ) {
      return { affiliateId: null, affiliatePid: null, source: null };
    }
    if (coupon?.affiliateId && !coupon.affiliate?.blacklist) {
      return {
        affiliateId: coupon.affiliateId,
        affiliatePid: coupon.affiliate?.pid ?? null,
        source: "coupon",
      };
    }
  }

  const pid = String(input.affiliatePid ?? "")
    .trim()
    .toLowerCase();
  if (!pid) {
    return { affiliateId: null, affiliatePid: null, source: null };
  }
  const profile = await prisma.affiliateProfile.findUnique({
    where: { pid },
    select: {
      id: true,
      pid: true,
      blacklist: true,
      status: true,
      userId: true,
      user: { select: { email: true } },
    },
  });
  if (
    isSelfPurchase({
      buyerUserId: input.buyerUserId,
      buyerEmail: input.buyerEmail,
      affiliateUserId: profile?.userId ?? null,
      affiliateEmail: profile?.user?.email ?? null,
    })
  ) {
    return { affiliateId: null, affiliatePid: null, source: null };
  }
  if (!profile || profile.blacklist || profile.status !== "active") {
    return { affiliateId: null, affiliatePid: null, source: null };
  }
  return { affiliateId: profile.id, affiliatePid: profile.pid ?? null, source: "pid" };
}

