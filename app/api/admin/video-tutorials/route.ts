import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import {
  deleteVideoTutorial,
  listVideoTutorials,
  saveVideoTutorial,
  type VideoAspectRatio,
} from "@/lib/video-tutorials";

function isAspectRatio(v: string): v is VideoAspectRatio {
  return v === "16:9" || v === "1:1" || v === "9:16";
}

export async function GET() {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tutorials = await listVideoTutorials({ includeFallback: false });
  return NextResponse.json({ tutorials });
}

export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    productSlug?: string;
    title?: string;
    url?: string;
    aspectRatio?: string;
  };
  const productSlug = (body.productSlug ?? "").trim();
  const title = (body.title ?? "").trim();
  const url = (body.url ?? "").trim();
  const ratio = (body.aspectRatio ?? "").trim();
  if (!productSlug || !title || !url || !isAspectRatio(ratio)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await saveVideoTutorial({
    productSlug,
    title,
    url,
    aspectRatio: ratio,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { productSlug?: string };
  const productSlug = (body.productSlug ?? "").trim();
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug is required" }, { status: 400 });
  }
  await deleteVideoTutorial(productSlug);
  return NextResponse.json({ ok: true });
}
