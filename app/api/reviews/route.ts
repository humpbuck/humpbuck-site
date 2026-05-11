import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getProductBySlug } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { assertReviewImageUrlsBelongToProduct } from "@/lib/r2-review-upload";
import {
  orderContainsProductSlug,
  orderStatusAllowsReview,
} from "@/lib/review-eligibility";

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

  const orderId = String(body.orderId ?? "").trim();
  const productSlug = String(body.productSlug ?? "").trim();
  const rating = Number(body.rating);
  const text = String(body.body ?? "").trim();
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string")
    : [];

  if (!orderId || !productSlug) {
    return NextResponse.json({ error: "orderId and productSlug required" }, { status: 400 });
  }
  if (!getProductBySlug(productSlug)) {
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
    assertReviewImageUrlsBelongToProduct(productSlug, imageUrls, MAX_IMAGES);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid images" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id, deletedAt: null },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!orderStatusAllowsReview(order.status)) {
    return NextResponse.json(
      { error: "This order is not eligible for reviews." },
      { status: 403 },
    );
  }
  if (!orderContainsProductSlug(order, productSlug)) {
    return NextResponse.json({ error: "Product not on order" }, { status: 403 });
  }

  try {
    const review = await prisma.productReview.create({
      data: {
        userId: session.user.id,
        orderId,
        productSlug,
        rating,
        body: text,
        imageUrlsJson: JSON.stringify(imageUrls),
      },
    });
    revalidatePath(`/product/${encodeURIComponent(productSlug)}`);
    return NextResponse.json({ id: review.id });
  } catch {
    return NextResponse.json(
      { error: "Could not save review (duplicate?)" },
      { status: 409 },
    );
  }
}
