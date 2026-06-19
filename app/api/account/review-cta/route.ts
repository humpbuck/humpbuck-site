import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPdpWriteReviewCta } from "@/lib/pdp-review-cta";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const productSlug = new URL(req.url).searchParams.get("productSlug")?.trim() ?? "";
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug required" }, { status: 400 });
  }

  try {
    const cta = await getPdpWriteReviewCta(session.user.id, productSlug);
    return NextResponse.json({ orderId: cta?.orderId ?? null });
  } catch (err) {
    console.error("[review-cta] failed", err);
    return NextResponse.json({ error: "Could not load review CTA" }, { status: 500 });
  }
}
