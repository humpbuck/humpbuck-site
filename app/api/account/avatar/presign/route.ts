import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  avatarObjectKey,
  isR2AvatarUploadConfigured,
  presignAvatarPut,
  publicUrlForAvatarKey,
} from "@/lib/r2-avatar-upload";

const MAX_BYTES = 600 * 1024;
const ALLOWED_TYPES = new Set(["image/webp"]);

export async function POST(req: Request) {
  if (!isR2AvatarUploadConfigured()) {
    return NextResponse.json(
      { error: "Avatar upload is not configured (R2 env vars)." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { contentType?: string; byteSize?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentType = String(body.contentType ?? "").trim();
  const byteSize = Number(body.byteSize);

  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Only image/webp is allowed (compress in the browser before upload)." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(byteSize) || byteSize < 1 || byteSize > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image must be 1–${MAX_BYTES} bytes after compression` },
      { status: 400 },
    );
  }

  const key = avatarObjectKey(session.user.id);
  const uploadUrl = await presignAvatarPut(key, contentType);
  const publicUrl = publicUrlForAvatarKey(key);

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
