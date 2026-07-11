import { NextResponse } from "next/server";

export async function GET() {
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    null;

  if (!publishableKey) {
    return NextResponse.json({ ok: false, error: "Stripe publishable key not configured" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, publishableKey });
}
