import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CHECKOUT_COUPON_ERROR_CODES } from "@/lib/checkout-coupon-errors";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { code?: string } | null;

    const code = body?.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.REQUIRED },
        { status: 400 },
      );
    }

    const now = new Date();
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json(
        { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.NOT_FOUND },
        { status: 404 },
      );
    }
    if (!coupon.isActive) {
      return NextResponse.json(
        { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.INACTIVE },
        { status: 400 },
      );
    }
    if (coupon.startsAt > now) {
      return NextResponse.json(
        { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.NOT_ACTIVE_YET },
        { status: 400 },
      );
    }
    if (coupon.endsAt < now) {
      return NextResponse.json(
        { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.EXPIRED },
        { status: 400 },
      );
    }
    if (coupon.usedCount >= coupon.quantity) {
      return NextResponse.json(
        { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.USAGE_LIMIT },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      coupon: {
        code: coupon.code,
        discountAmount: coupon.amountOffCents,
        currency: "USD",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_COUPON_ERROR_CODES.VALIDATE_FAILED },
      { status: 500 },
    );
  }
}
