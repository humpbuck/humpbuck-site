import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  MAX_APPEND_BODY,
  MAX_APPEND_IMAGES,
  MAX_REVIEW_APPENDS,
} from "@/lib/review-append-constants";
import { getProductBySlug } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { assertReviewImageUrlsBelongToProduct } from "@/lib/r2-review-upload";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    reviewId?: string;
    body?: string;
    imageUrls?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reviewId = String(body.reviewId ?? "").trim();
  const text = String(body.body ?? "").trim();
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string")
    : [];

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }
  if (text.length > MAX_APPEND_BODY) {
    return NextResponse.json({ error: "Follow-up is too long" }, { status: 400 });
  }

  const review = await prisma.productReview.findFirst({
    where: { id: reviewId, userId: session.user.id },
    include: { _count: { select: { appends: true } } },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (!getProductBySlug(review.productSlug)) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }
  if (review._count.appends >= MAX_REVIEW_APPENDS) {
    return NextResponse.json(
      { error: "Maximum number of follow-up comments reached." },
      { status: 400 },
    );
  }

  try {
    assertReviewImageUrlsBelongToProduct(
      review.productSlug,
      imageUrls,
      MAX_APPEND_IMAGES,
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid images" },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.productReviewAppend.create({
      data: {
        reviewId: review.id,
        body: text,
        imageUrlsJson: JSON.stringify(imageUrls),
      },
    });
    revalidatePath(
      `/product/${encodeURIComponent(review.productSlug)}`,
    );
    return NextResponse.json({ id: row.id });
  } catch {
    return NextResponse.json(
      { error: "Could not save follow-up" },
      { status: 500 },
    );
  }
}
