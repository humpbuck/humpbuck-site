import type { MetadataRoute } from "next";
import { seriesList } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { listPublishedBlogPosts } from "@/lib/blog-posts";
import { routing } from "@/i18n/routing";
import { storefrontLocalizedPath } from "@/lib/storefront-hreflang";
import { getSiteUrl } from "@/lib/seo";

/** Regenerate when admin catalog/blog saves call `revalidateSitemap()` or on deploy. */
export const revalidate = false;

const STATIC_PATHS: {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/product", changeFrequency: "daily", priority: 0.95 },
    { path: "/cart", changeFrequency: "weekly", priority: 0.4 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/affiliates", changeFrequency: "monthly", priority: 0.65 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
    { path: "/video-tutorial", changeFrequency: "monthly", priority: 0.65 },
    { path: "/shipping", changeFrequency: "yearly", priority: 0.5 },
    { path: "/refund", changeFrequency: "yearly", priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    STATIC_PATHS.map((e) => ({
      url: `${base}${storefrontLocalizedPath(e.path, locale)}`,
      lastModified,
      changeFrequency: e.changeFrequency,
      priority: e.priority,
    })),
  );

  const seriesEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    seriesList.map((s) => ({
      url: `${base}${storefrontLocalizedPath(`/series/${encodeURIComponent(s.slug)}`, locale)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  );

  const products = await getMergedCatalogProducts();
  const productEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    products.map((p) => ({
      url: `${base}${storefrontLocalizedPath(`/product/${encodeURIComponent(p.slug)}`, locale)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  const blogPosts = await listPublishedBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    blogPosts.map((post) => ({
      url: `${base}${storefrontLocalizedPath(`/blog/${encodeURIComponent(post.slug)}`, locale)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [...staticEntries, ...seriesEntries, ...productEntries, ...blogEntries];
}
