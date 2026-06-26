import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";
import {
  deleteVideoTutorial,
  listVideoTutorials,
  saveVideoTutorialOrder,
  saveVideoTutorial,
  type VideoAspectRatio,
} from "@/lib/video-tutorials";

function isAspectRatio(v: string): v is VideoAspectRatio {
  return v === "16:9" || v === "1:1" || v === "9:16";
}

function revalidateVideoTutorialPages(): void {
  revalidateStorefrontPath("/video-tutorial");
}

export async function GET() {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tutorials = await listVideoTutorials();
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
    youtubeUrl?: string;
    aspectRatio?: string;
    sortOrder?: number;
  };
  const productSlug = (body.productSlug ?? "").trim();
  const title = (body.title ?? "").trim();
  const url = (body.url ?? "").trim();
  const youtubeUrl = (body.youtubeUrl ?? "").trim();
  const ratio = (body.aspectRatio ?? "").trim();
  if (!productSlug || !title || (!url && !youtubeUrl) || !isAspectRatio(ratio)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await saveVideoTutorial({
    productSlug,
    title,
    url,
    youtubeUrl,
    aspectRatio: ratio,
    sortOrder:
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : undefined,
  });
  revalidateVideoTutorialPages();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { orderedProductSlugs?: string[] };
  const ordered = Array.isArray(body.orderedProductSlugs)
    ? body.orderedProductSlugs.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
    : [];
  if (ordered.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await saveVideoTutorialOrder(ordered);
  revalidateVideoTutorialPages();
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
  revalidateVideoTutorialPages();
  return NextResponse.json({ ok: true });
}
