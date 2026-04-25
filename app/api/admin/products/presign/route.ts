import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  buildProductMediaObjectKey,
  isR2ProductUploadConfigured,
  presignProductMediaPut,
  publicUrlForProductMediaKey,
  type ProductMediaSection,
} from "@/lib/r2-admin-product-upload";

const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4"]);

export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2ProductUploadConfigured()) {
    return NextResponse.json(
      { error: "R2 is not configured. Set R2 env vars first." },
      { status: 503 },
    );
  }

  let body: {
    productSlug?: string;
    section?: ProductMediaSection;
    contentType?: string;
    byteSize?: number;
    variantId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productSlug = String(body.productSlug ?? "").trim();
  const section = String(body.section ?? "").trim() as ProductMediaSection;
  const contentType = String(body.contentType ?? "").trim();
  const byteSize = Number(body.byteSize);
  const variantId = String(body.variantId ?? "").trim();

  if (!productSlug || !section || !contentType) {
    return NextResponse.json(
      { error: "productSlug, section, contentType are required" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(byteSize) || byteSize < 1) {
    return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
  }

  const isVideo = section === "video";
  if (isVideo) {
    if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Video must be MP4" }, { status: 400 });
    }
    if (byteSize > 80 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Video must be <= 80MB" },
        { status: 400 },
      );
    }
  } else {
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Image must be WEBP" }, { status: 400 });
    }
    if (byteSize > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be <= 8MB" },
        { status: 400 },
      );
    }
  }

  const key = buildProductMediaObjectKey({
    productSlug,
    section,
    contentType,
    variantId,
  });
  const uploadUrl = await presignProductMediaPut(key, contentType);
  const publicUrl = publicUrlForProductMediaKey(key);

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
