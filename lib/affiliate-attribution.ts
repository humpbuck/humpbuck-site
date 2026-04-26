import { prisma } from "@/lib/prisma";

type AttributionInput = {
  couponId?: string | null;
  affiliatePid?: string | null;
};

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
      select: { affiliateId: true, affiliate: { select: { pid: true, blacklist: true } } },
    });
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
    select: { id: true, pid: true, blacklist: true, status: true },
  });
  if (!profile || profile.blacklist || profile.status !== "active") {
    return { affiliateId: null, affiliatePid: null, source: null };
  }
  return { affiliateId: profile.id, affiliatePid: profile.pid ?? null, source: "pid" };
}

