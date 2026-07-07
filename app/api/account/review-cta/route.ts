import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAppendableReviewIdsForUser,
  getPdpReviewFormAccess,
} from "@/lib/pdp-review-form-access";
import { getPdpWriteReviewCta } from "@/lib/pdp-review-cta";

export async function GET(req: Request) {
  const productSlug = new URL(req.url).searchParams.get("productSlug")?.trim() ?? "";
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug required" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({
      access: "guest",
      orderId: null,
      appendableReviewIds: [],
    });
  }

  try {
    const [access, cta, appendableReviewIds] = await Promise.all([
      getPdpReviewFormAccess(session.user.id, productSlug),
      getPdpWriteReviewCta(session.user.id, productSlug),
      getAppendableReviewIdsForUser(session.user.id, productSlug),
    ]);

    return NextResponse.json({
      access: access.kind,
      orderId: access.kind === "eligible" ? access.orderId : (cta?.orderId ?? null),
      appendableReviewIds,
    });
  } catch (err) {
    console.error("[review-cta] failed", err);
    return NextResponse.json({ error: "Could not load review CTA" }, { status: 500 });
  }
}
