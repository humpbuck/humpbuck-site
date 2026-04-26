import { NextResponse } from "next/server";
import { resolveCouponDiscount } from "@/lib/coupon";

export async function POST(req: Request) {
  let body: { code?: string; totalCents?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const totalCents = Math.max(0, Math.floor(Number(body.totalCents) || 0));
  if (totalCents <= 0) {
    return NextResponse.json({ error: "Cart total must be greater than 0." }, { status: 400 });
  }

  const resolved = await resolveCouponDiscount({
    code: body.code,
    totalCents,
  });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    code: resolved.code,
    discountCents: resolved.discountCents,
  });
}
