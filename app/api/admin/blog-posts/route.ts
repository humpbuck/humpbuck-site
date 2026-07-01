import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isPrismaUniqueViolation } from "@/lib/admin-product-slug";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { revalidateSitemap, revalidateStorefrontPath } from "@/lib/revalidate-storefront";
import {
  createBlogPost,
  listBlogPostsAdmin,
  saveBlogPostOrder,
  type BlogPostInput,
} from "@/lib/blog-posts";

function revalidateBlogPages(slug?: string) {
  revalidatePath(adminPath("/blog"));
  revalidateSitemap();
  revalidateStorefrontPath("/");
  revalidateStorefrontPath("/blog");
  if (slug) {
    revalidateStorefrontPath(`/blog/${encodeURIComponent(slug)}`);
  }
}

function parsePayload(body: {
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  coverImageUrl?: string;
  homeCarouselSlot?: number | null;
  homeCarouselImageUrl?: string;
  homeCarouselDescription?: string;
  status?: string;
  sortOrder?: number;
}): BlogPostInput {
  const rawSlot = body.homeCarouselSlot;
  const homeCarouselSlot =
    typeof rawSlot === "number" && Number.isFinite(rawSlot) ? rawSlot : null;
  return {
    slug: (body.slug ?? "").trim(),
    title: (body.title ?? "").trim(),
    excerpt: (body.excerpt ?? "").trim(),
    body: (body.body ?? "").trim(),
    coverImageUrl: (body.coverImageUrl ?? "").trim(),
    homeCarouselSlot,
    homeCarouselImageUrl: (body.homeCarouselImageUrl ?? "").trim(),
    homeCarouselDescription: (body.homeCarouselDescription ?? "").trim(),
    status: body.status === "published" ? "published" : "draft",
    sortOrder:
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : 0,
  };
}

function saveErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "INVALID_BLOG_POST") {
    return NextResponse.json(
      {
        error:
          "Slug must use lowercase letters, numbers, and hyphens (e.g. eastern-energy). Title and body are required.",
      },
      { status: 400 },
    );
  }
  if (isPrismaUniqueViolation(error)) {
    return NextResponse.json(
      { error: "This slug is already used by another article." },
      { status: 409 },
    );
  }
  return NextResponse.json({ error: "Save failed" }, { status: 500 });
}

export async function GET() {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = await listBlogPostsAdmin();
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Parameters<typeof parsePayload>[0];
  const payload = parsePayload(body);
  try {
    const post = await createBlogPost(payload);
    revalidateBlogPages(post.slug);
    return NextResponse.json({ post });
  } catch (error) {
    return saveErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { orderedIds?: string[] };
  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
    : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await saveBlogPostOrder(orderedIds);
  revalidateBlogPages();
  return NextResponse.json({ ok: true });
}
