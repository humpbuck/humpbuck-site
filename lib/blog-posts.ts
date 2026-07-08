import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  isBlogPostSlugValid,
  normalizeBlogPostSlug,
  type BlogPostInput,
  type BlogPostRow,
  type BlogPostStatus,
} from "@/lib/blog-post-shared";

export type {
  BlogPostCard,
  BlogPostInput,
  BlogPostRow,
  BlogPostStatus,
} from "@/lib/blog-post-shared";
export {
  blogPostPublicPath,
  formatBlogPostDate,
  isBlogPostSlugValid,
  normalizeBlogPostSlug,
} from "@/lib/blog-post-shared";

const BLOG_SELECT = `
  "id", "slug", "title", "excerpt", "body", "coverImageUrl",
  "homeCarouselSlot", "homeCarouselImageUrl", "homeCarouselDescription",
  "status", "sortOrder", "publishedAt", "createdAt", "updatedAt"
`;

type DbBlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  homeCarouselSlot: number | null;
  homeCarouselImageUrl: string;
  homeCarouselDescription: string;
  status: string;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

let blogTableReady: Promise<void> | null = null;

async function ensureBlogPostTable(): Promise<void> {
  if (!blogTableReady) {
    blogTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlogPost" (
          "id" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "excerpt" TEXT NOT NULL DEFAULT '',
          "body" TEXT NOT NULL DEFAULT '',
          "coverImageUrl" TEXT NOT NULL DEFAULT '',
          "homeCarouselSlot" INTEGER,
          "homeCarouselImageUrl" TEXT NOT NULL DEFAULT '',
          "homeCarouselDescription" TEXT NOT NULL DEFAULT '',
          "status" TEXT NOT NULL DEFAULT 'draft',
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "publishedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug")
      `).catch(() => null);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BlogPost_status_sortOrder_idx"
        ON "BlogPost"("status", "sortOrder")
      `).catch(() => null);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt")
      `).catch(() => null);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "homeCarouselSlot" INTEGER
      `).catch(() => null);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "homeCarouselImageUrl" TEXT NOT NULL DEFAULT ''
      `).catch(() => null);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "homeCarouselDescription" TEXT NOT NULL DEFAULT ''
      `).catch(() => null);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BlogPost_homeCarouselSlot_idx" ON "BlogPost"("homeCarouselSlot")
      `).catch(() => null);
    })();
  }
  await blogTableReady;
}

function rowFromDb(row: DbBlogPostRow): BlogPostRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImageUrl: row.coverImageUrl,
    homeCarouselSlot: row.homeCarouselSlot,
    homeCarouselImageUrl: row.homeCarouselImageUrl,
    homeCarouselDescription: row.homeCarouselDescription,
    status: row.status === "published" ? "published" : "draft",
    sortOrder: row.sortOrder,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function queryBlogPosts(sql: string): Promise<BlogPostRow[]> {
  try {
    await ensureBlogPostTable();
    const rows = (await prisma.$queryRawUnsafe(sql)) as DbBlogPostRow[];
    return rows.map(rowFromDb);
  } catch (e) {
    console.error("[blog-posts] Failed to load blog posts; returning empty list.", e);
    return [];
  }
}

async function queryBlogPostById(id: string): Promise<BlogPostRow | null> {
  await ensureBlogPostTable();
  const rows = (await prisma.$queryRaw`
    SELECT "id", "slug", "title", "excerpt", "body", "coverImageUrl",
           "homeCarouselSlot", "homeCarouselImageUrl", "homeCarouselDescription",
           "status", "sortOrder", "publishedAt", "createdAt", "updatedAt"
    FROM "BlogPost"
    WHERE "id" = ${id}
    LIMIT 1
  `) as DbBlogPostRow[];
  return rows[0] ? rowFromDb(rows[0]) : null;
}

export function cleanBlogPostSlug(input: string): string | null {
  const slug = normalizeBlogPostSlug(input);
  if (!isBlogPostSlugValid(slug)) return null;
  return slug;
}

function cleanCoverImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return trimmed.slice(0, 2048);
}

function cleanHomeCarouselSlot(slot: number | null | undefined): number | null {
  if (typeof slot !== "number" || !Number.isFinite(slot)) return null;
  const rounded = Math.round(slot);
  return rounded >= 1 && rounded <= 6 ? rounded : null;
}

function prepareInput(input: BlogPostInput): BlogPostInput | null {
  const slug = cleanBlogPostSlug(input.slug);
  if (!slug) return null;
  const title = input.title.trim().slice(0, 200);
  if (!title) return null;
  const body = input.body.trim();
  if (!body) return null;
  return {
    slug,
    title,
    excerpt: input.excerpt.trim().slice(0, 500),
    body: body.slice(0, 50000),
    coverImageUrl: cleanCoverImageUrl(input.coverImageUrl),
    homeCarouselSlot: cleanHomeCarouselSlot(input.homeCarouselSlot),
    homeCarouselImageUrl: cleanCoverImageUrl(input.homeCarouselImageUrl),
    homeCarouselDescription: input.homeCarouselDescription.trim().slice(0, 280),
    status: input.status === "published" ? "published" : "draft",
    sortOrder: Number.isFinite(input.sortOrder) ? Math.round(input.sortOrder) : 0,
  };
}

export async function listPublishedBlogPosts(): Promise<BlogPostRow[]> {
  return queryBlogPosts(`
    SELECT ${BLOG_SELECT}
    FROM "BlogPost"
    WHERE "status" = 'published'
    ORDER BY "sortOrder" ASC, CASE WHEN "publishedAt" IS NULL THEN 1 ELSE 0 END, "publishedAt" DESC, "updatedAt" DESC
  `);
}

export async function listPublishedHomeCarouselBlogPosts(): Promise<BlogPostRow[]> {
  const rows = await queryBlogPosts(`
    SELECT ${BLOG_SELECT}
    FROM "BlogPost"
    WHERE "status" = 'published'
      AND "homeCarouselSlot" BETWEEN 1 AND 6
      AND (
        TRIM("homeCarouselImageUrl") <> ''
        OR TRIM("coverImageUrl") <> ''
      )
    ORDER BY "homeCarouselSlot" ASC, "updatedAt" DESC
  `);

  const deduped = new Map<number, BlogPostRow>();
  for (const row of rows) {
    if (row.homeCarouselSlot == null || deduped.has(row.homeCarouselSlot)) continue;
    deduped.set(row.homeCarouselSlot, row);
  }

  return [...deduped.values()].sort(
    (a, b) => (a.homeCarouselSlot ?? 0) - (b.homeCarouselSlot ?? 0),
  );
}

export async function getPublishedBlogPostBySlug(
  slug: string,
): Promise<BlogPostRow | null> {
  const cleaned = cleanBlogPostSlug(slug);
  if (!cleaned) return null;
  try {
    await ensureBlogPostTable();
    const rows = (await prisma.$queryRaw`
      SELECT "id", "slug", "title", "excerpt", "body", "coverImageUrl",
             "homeCarouselSlot", "homeCarouselImageUrl", "homeCarouselDescription",
             "status", "sortOrder", "publishedAt", "createdAt", "updatedAt"
      FROM "BlogPost"
      WHERE "slug" = ${cleaned} AND "status" = 'published'
      LIMIT 1
    `) as DbBlogPostRow[];
    return rows[0] ? rowFromDb(rows[0]) : null;
  } catch (e) {
    console.error("[blog-posts] Failed to load published blog post:", cleaned, e);
    return null;
  }
}

export async function listBlogPostsAdmin(): Promise<BlogPostRow[]> {
  return queryBlogPosts(`
    SELECT ${BLOG_SELECT}
    FROM "BlogPost"
    ORDER BY "updatedAt" DESC, "sortOrder" ASC
  `);
}

export async function createBlogPost(input: BlogPostInput): Promise<BlogPostRow> {
  const data = prepareInput(input);
  if (!data) throw new Error("INVALID_BLOG_POST");
  await ensureBlogPostTable();
  const id = randomUUID();
  const publishedAt = data.status === "published" ? new Date() : null;
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "BlogPost" (
      "id", "slug", "title", "excerpt", "body", "coverImageUrl",
      "homeCarouselSlot", "homeCarouselImageUrl", "homeCarouselDescription",
      "status", "sortOrder", "publishedAt", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${data.slug}, ${data.title}, ${data.excerpt}, ${data.body}, ${data.coverImageUrl},
      ${data.homeCarouselSlot}, ${data.homeCarouselImageUrl}, ${data.homeCarouselDescription},
      ${data.status}, ${data.sortOrder}, ${publishedAt}, ${now}, ${now}
    )
  `;
  const row = await queryBlogPostById(id);
  if (!row) throw new Error("BLOG_POST_CREATE_FAILED");
  return row;
}

export async function updateBlogPost(
  id: string,
  input: BlogPostInput,
): Promise<BlogPostRow | null> {
  const existing = await queryBlogPostById(id);
  if (!existing) return null;
  const data = prepareInput(input);
  if (!data) throw new Error("INVALID_BLOG_POST");

  const publishedAt =
    data.status === "published" ? existing.publishedAt ?? new Date() : null;

  const updatedAt = new Date();
  await prisma.$executeRaw`
    UPDATE "BlogPost"
    SET
      "slug" = ${data.slug},
      "title" = ${data.title},
      "excerpt" = ${data.excerpt},
      "body" = ${data.body},
      "coverImageUrl" = ${data.coverImageUrl},
      "homeCarouselSlot" = ${data.homeCarouselSlot},
      "homeCarouselImageUrl" = ${data.homeCarouselImageUrl},
      "homeCarouselDescription" = ${data.homeCarouselDescription},
      "status" = ${data.status},
      "sortOrder" = ${data.sortOrder},
      "publishedAt" = ${publishedAt},
      "updatedAt" = ${updatedAt}
    WHERE "id" = ${id}
  `;
  return queryBlogPostById(id);
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const existing = await queryBlogPostById(id);
  if (!existing) return false;
  await prisma.$executeRaw`DELETE FROM "BlogPost" WHERE "id" = ${id}`;
  return true;
}

export async function saveBlogPostOrder(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.map((x) => x.trim()).filter(Boolean))];
  await ensureBlogPostTable();
  for (let index = 0; index < unique.length; index += 1) {
    const id = unique[index];
    const sortUpdatedAt = new Date();
    await prisma.$executeRaw`
      UPDATE "BlogPost"
      SET "sortOrder" = ${index + 1}, "updatedAt" = ${sortUpdatedAt}
      WHERE "id" = ${id}
    `;
  }
}
