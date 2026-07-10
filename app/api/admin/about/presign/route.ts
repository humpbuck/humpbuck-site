import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  isR2AboutUploadConfigured,
  presignAboutFounderImagePut,
  publicUrlForAboutFounderImageKey,
} from "@/lib/r2-admin-about-upload";

const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);

export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2AboutUploadConfigured()) {
    return NextResponse.json(
      { error: "R2 is not configured. Set R2 env vars first." },
      { status: 503 },
    );
  }

  let body: { contentType?: string; byteSize?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentType = String(body.contentType ?? "").trim();
  const byteSize = Number(body.byteSize);

  if (!contentType) {
    return NextResponse.json({ error: "contentType is required" }, { status: 400 });
  }
  if (!Number.isFinite(byteSize) || byteSize < 1) {
    return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Image must be WEBP" }, { status: 400 });
  }
  if (byteSize > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be <= 8MB" }, { status: 400 });
  }

  const uploadUrl = await presignAboutFounderImagePut(contentType);
  const publicUrl = publicUrlForAboutFounderImageKey();

  return NextResponse.json({ uploadUrl, publicUrl });
}
