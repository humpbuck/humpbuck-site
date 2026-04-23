import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isLocalReviewImageUploadEnabled,
  saveLocalReviewImageFromToken,
} from "@/lib/review-local-dev-upload";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Dev-only: upload WebP bytes when R2 is not configured (writes to `public/review-uploads/`).
 */
export async function POST(req: Request) {
  if (!isLocalReviewImageUploadEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const u = new URL(req.url);
  const token = u.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const ct = req.headers.get("content-type")?.split(";")[0]?.trim();
  if (ct !== "image/webp") {
    return NextResponse.json(
      { error: "Only image/webp is allowed" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await req.arrayBuffer());
  try {
    const publicPath = await saveLocalReviewImageFromToken(
      token,
      session.user.id,
      buf,
      MAX_BYTES,
    );
    return NextResponse.json({ ok: true, publicUrl: publicPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
