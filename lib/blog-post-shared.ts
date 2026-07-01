/** Client-safe blog types and helpers (no Prisma). */

export type BlogPostStatus = "draft" | "published";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  homeCarouselSlot: number | null;
  homeCarouselImageUrl: string;
  homeCarouselDescription: string;
  status: BlogPostStatus;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostCard = Pick<
  BlogPostRow,
  | "slug"
  | "title"
  | "excerpt"
  | "coverImageUrl"
  | "homeCarouselSlot"
  | "homeCarouselImageUrl"
  | "homeCarouselDescription"
  | "publishedAt"
>;

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  homeCarouselSlot: number | null;
  homeCarouselImageUrl: string;
  homeCarouselDescription: string;
  status: BlogPostStatus;
  sortOrder: number;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeBlogPostSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isBlogPostSlugValid(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 80;
}

export function blogPostPublicPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function formatBlogPostDate(
  date: Date | null | undefined,
  locale: string,
): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
