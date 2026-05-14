import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { code?: string; affiliatePid?: string | null }
      | null;

    const code = body?.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, error: "Coupon code is required." }, { status: 400 });
    }

    const now = new Date();
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: {
        affiliate: { select: { pid: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({ ok: false, error: "Coupon not found." }, { status: 404 });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ ok: false, error: "Coupon is inactive." }, { status: 400 });
    }
    if (coupon.startsAt > now) {
      return NextResponse.json({ ok: false, error: "Coupon is not active yet." }, { status: 400 });
    }
    if (coupon.endsAt < now) {
      return NextResponse.json({ ok: false, error: "Coupon has expired." }, { status: 400 });
    }
    if (coupon.usedCount >= coupon.quantity) {
      return NextResponse.json({ ok: false, error: "Coupon has reached its usage limit." }, { status: 400 });
    }

    const affiliatePid = body?.affiliatePid?.trim() || null;
    if (coupon.affiliateId && coupon.affiliate?.pid) {
      if (affiliatePid && affiliatePid !== coupon.affiliate.pid) {
        return NextResponse.json({ ok: false, error: "This coupon is not valid for your referral source." }, { status: 403 });
      }
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        code: coupon.code,
        discountAmount: coupon.amountOffCents,
        currency: "USD",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to validate coupon." },
      { status: 500 },
    );
  }
}
