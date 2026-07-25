/** Client-safe blog types and helpers (no Prisma). */

export type BlogPostStatus = "draft" | "published";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  /** CatalogProduct ids shown as related products under the article. */
  productIds: string[];
  status: BlogPostStatus;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostCard = Pick<
  BlogPostRow,
  "slug" | "title" | "excerpt" | "coverImageUrl" | "publishedAt"
>;

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  productIds: string[];
  status: BlogPostStatus;
  sortOrder: number;
};

export function normalizeBlogProductIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= 24) break;
  }
  return ids;
}

export function parseBlogProductIdsJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    return normalizeBlogProductIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

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
