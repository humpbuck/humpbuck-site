import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isPrismaUniqueViolation } from "@/lib/admin-product-slug";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  deleteBlogPost,
  updateBlogPost,
  type BlogPostInput,
} from "@/lib/blog-posts";

function revalidateBlogPages(slug?: string) {
  revalidatePath(adminPath("/blog"));
  revalidatePath("/blog");
  if (slug) {
    revalidatePath(`/blog/${encodeURIComponent(slug)}`);
  }
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json()) as {
    slug?: string;
    title?: string;
    excerpt?: string;
    body?: string;
    coverImageUrl?: string;
    status?: string;
    sortOrder?: number;
  };
  const payload: BlogPostInput = {
    slug: (body.slug ?? "").trim(),
    title: (body.title ?? "").trim(),
    excerpt: (body.excerpt ?? "").trim(),
    body: (body.body ?? "").trim(),
    coverImageUrl: (body.coverImageUrl ?? "").trim(),
    status: body.status === "published" ? "published" : "draft",
    sortOrder:
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? body.sortOrder
        : 0,
  };
  try {
    const post = await updateBlogPost(id, payload);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    revalidateBlogPages(post.slug);
    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_BLOG_POST") {
      return NextResponse.json(
        {
          error:
            "Slug must use lowercase letters, numbers, and hyphens (e.g. mechanical-watches). Title and body are required.",
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
}

export async function DELETE(_req: Request, context: RouteContext) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const ok = await deleteBlogPost(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  revalidateBlogPages();
  return NextResponse.json({ ok: true });
}
