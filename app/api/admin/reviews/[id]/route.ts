import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { markProductReviewInboxHandled } from "@/lib/admin-inbox";
import { getProductBySlug } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";
import { revalidateProductReviews } from "@/lib/revalidate-product-reviews";
import { isProductReviewStatus } from "@/lib/review-status";

const MAX_MERCHANT_REPLY = 5_000;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { merchantReply?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const review = await prisma.productReview.findUnique({
    where: { id },
    select: { productSlug: true, status: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (body.status !== undefined) {
    const status = String(body.status).trim();
    if (!isProductReviewStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await prisma.productReview.update({
      where: { id },
      data: { status },
    });
    if (status === "approved" || status === "rejected") {
      await markProductReviewInboxHandled(id);
    }
    revalidateProductReviews(review.productSlug);
    if (await getProductBySlug(review.productSlug)) {
      revalidateStorefrontPath(`/product/${encodeURIComponent(review.productSlug)}`);
    }
    return NextResponse.json({ ok: true, status });
  }

  const reply = String(body.merchantReply ?? "").trim();
  if (!reply) {
    return NextResponse.json(
      { error: "merchantReply (non-empty string) is required" },
      { status: 400 },
    );
  }
  if (reply.length > MAX_MERCHANT_REPLY) {
    return NextResponse.json({ error: "Reply is too long" }, { status: 400 });
  }

  await prisma.productReview.update({
    where: { id },
    data: {
      merchantReply: reply,
      merchantRepliedAt: new Date(),
    },
  });
  revalidateProductReviews(review.productSlug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const review = await prisma.productReview.findUnique({
    where: { id },
    select: { productSlug: true },
  });
  const deleted = await prisma.productReview.deleteMany({ where: { id } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  await markProductReviewInboxHandled(id);
  if (review && (await getProductBySlug(review.productSlug))) {
    revalidateProductReviews(review.productSlug);
    revalidateStorefrontPath(`/product/${encodeURIComponent(review.productSlug)}`);
  }

  return NextResponse.json({ ok: true });
}
