import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MAX_REVIEW_APPENDS } from "@/lib/review-append-constants";
import { prisma } from "@/lib/prisma";
import {
  createLocalReviewAppendUploadSlot,
  createLocalReviewUploadSlot,
  isLocalReviewImageUploadEnabled,
} from "@/lib/review-local-dev-upload";
import {
  isR2ReviewUploadConfigured,
  presignReviewImagePut,
  publicUrlForReviewKey,
  reviewAppendImageObjectKey,
  reviewImageObjectKey,
} from "@/lib/r2-review-upload";
import {
  orderContainsProductSlug,
  orderStatusAllowsReview,
} from "@/lib/review-eligibility";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/webp"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    productSlug?: string;
    contentType?: string;
    byteSize?: number;
    appendReviewId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productSlug = String(body.productSlug ?? "").trim();
  const contentType = String(body.contentType ?? "").trim();
  const byteSize = Number(body.byteSize);
  const appendReviewId = String(body.appendReviewId ?? "").trim();

  if (!productSlug) {
    return NextResponse.json({ error: "productSlug is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Only image/webp is allowed (compress in browser before upload)." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(byteSize) || byteSize < 1 || byteSize > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image must be 1 byte – ${MAX_BYTES} bytes` },
      { status: 400 },
    );
  }

  if (appendReviewId) {
    return presignForAppend(
      session.user.id,
      appendReviewId,
      productSlug,
      contentType,
    );
  }

  const orderId = String(body.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId and productSlug required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id, deletedAt: null },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!orderStatusAllowsReview(order.status)) {
    return NextResponse.json(
      { error: "This order is not eligible for reviews yet." },
      { status: 403 },
    );
  }
  if (!orderContainsProductSlug(order.itemsJson, productSlug)) {
    return NextResponse.json(
      { error: "This product is not on that order." },
      { status: 403 },
    );
  }

  const existing = await prisma.productReview.findUnique({
    where: {
      userId_orderId_productSlug: {
        userId: session.user.id,
        orderId,
        productSlug,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already submitted a review for this item." },
      { status: 409 },
    );
  }

  return respondWithNewReviewUpload(session.user.id, productSlug, contentType);
}

async function presignForAppend(
  userId: string,
  appendReviewId: string,
  productSlug: string,
  contentType: string,
) {
  const review = await prisma.productReview.findFirst({
    where: { id: appendReviewId, userId, productSlug },
    include: { _count: { select: { appends: true } } },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (review._count.appends >= MAX_REVIEW_APPENDS) {
    return NextResponse.json(
      { error: "Maximum number of follow-up comments reached for this review." },
      { status: 400 },
    );
  }

  if (isR2ReviewUploadConfigured()) {
    const key = reviewAppendImageObjectKey(review.productSlug, userId);
    const uploadUrl = await presignReviewImagePut(key, contentType);
    const publicUrl = publicUrlForReviewKey(key);
    return NextResponse.json({ uploadUrl, publicUrl, key });
  }
  if (isLocalReviewImageUploadEnabled()) {
    const { token, publicPath } = createLocalReviewAppendUploadSlot(
      userId,
      review.productSlug,
    );
    const putUrl = `/api/reviews/local-upload?token=${encodeURIComponent(token)}`;
    return NextResponse.json({
      useLocalUpload: true,
      putUrl,
      publicUrl: publicPath,
    });
  }
  return NextResponse.json(
    {
      error:
        "Review image upload is not configured. Set R2 credentials in .env (see .env.example), or run locally with `next dev` (uses public/review-uploads).",
    },
    { status: 503 },
  );
}

async function respondWithNewReviewUpload(
  userId: string,
  productSlug: string,
  contentType: string,
) {
  if (isR2ReviewUploadConfigured()) {
    const key = reviewImageObjectKey(productSlug, userId);
    const uploadUrl = await presignReviewImagePut(key, contentType);
    const publicUrl = publicUrlForReviewKey(key);
    return NextResponse.json({ uploadUrl, publicUrl, key });
  }
  if (isLocalReviewImageUploadEnabled()) {
    const { token, publicPath } = createLocalReviewUploadSlot(userId, productSlug);
    const putUrl = `/api/reviews/local-upload?token=${encodeURIComponent(token)}`;
    return NextResponse.json({
      useLocalUpload: true,
      putUrl,
      publicUrl: publicPath,
    });
  }
  return NextResponse.json(
    {
      error:
        "Review image upload is not configured. Set R2 credentials in .env (see .env.example), or run locally with `next dev` (uses public/review-uploads).",
    },
    { status: 503 },
  );
}
