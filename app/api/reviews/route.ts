import { NextResponse } from "next/server";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";
import { auth } from "@/auth";
import { notifyAdminInboxProductReview } from "@/lib/admin-inbox";
import { getProductBySlug } from "@/lib/catalog-server";
import { prisma } from "@/lib/prisma";
import { assertReviewImageUrlsBelongToProduct } from "@/lib/r2-review-upload";
import {
  orderContainsProductSlug,
  orderStatusAllowsReview,
} from "@/lib/review-eligibility";
import { findEligibleOrderIdForProductReview } from "@/lib/review-eligibility-queries";

const MAX_IMAGES = 4;
const MAX_BODY = 2000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    productSlug?: string;
    rating?: number;
    body?: string;
    imageUrls?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let orderId = String(body.orderId ?? "").trim() || null;
  const productSlug = String(body.productSlug ?? "").trim();
  const rating = Number(body.rating);
  const text = String(body.body ?? "").trim();
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string")
    : [];

  if (!productSlug) {
    return NextResponse.json({ error: "productSlug required" }, { status: 400 });
  }
  const product = await getProductBySlug(productSlug);
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Review text is required" }, { status: 400 });
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: "Review is too long" }, { status: 400 });
  }

  try {
    await assertReviewImageUrlsBelongToProduct(productSlug, imageUrls, MAX_IMAGES);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid images" },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, deletedAt: null },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!orderStatusAllowsReview(order.status)) {
      return NextResponse.json(
        { error: "Confirm receipt before writing a review." },
        { status: 403 },
      );
    }
    if (!orderContainsProductSlug(order, productSlug)) {
      return NextResponse.json({ error: "Product not on order" }, { status: 403 });
    }
  } else {
    orderId = await findEligibleOrderIdForProductReview(userId, productSlug);
  }

  if (!orderId) {
    return NextResponse.json(
      { error: "You can only review products you have purchased." },
      { status: 403 },
    );
  }

  const existing = await prisma.productReview.findFirst({
    where: { userId, orderId, productSlug },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already submitted a review for this product." },
      { status: 409 },
    );
  }

  try {
    const review = await prisma.productReview.create({
      data: {
        userId,
        orderId,
        productSlug,
        rating,
        body: text,
        imageUrlsJson: JSON.stringify(imageUrls),
        status: "pending",
      },
    });
    await notifyAdminInboxProductReview({
      reviewId: review.id,
      productSlug,
      productName: product.name,
      rating,
      body: text,
      buyerEmail: session.user.email,
    });
    revalidateStorefrontPath(`/product/${encodeURIComponent(productSlug)}`);
    revalidateStorefrontPath(`/account/orders/${orderId}`);
    return NextResponse.json({ id: review.id, status: review.status });
  } catch {
    return NextResponse.json(
      { error: "Could not save review (duplicate?)" },
      { status: 409 },
    );
  }
}
