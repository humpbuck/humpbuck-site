import type { MetadataRoute } from "next";
import { seriesList } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { listPublishedBlogPosts } from "@/lib/blog-posts";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

/** Regenerate when admin catalog/blog saves call `revalidateSitemap()` or on deploy. */
export const revalidate = false;

const STATIC_PATHS: {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/product", changeFrequency: "daily", priority: 0.95 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/affiliates", changeFrequency: "monthly", priority: 0.65 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
    { path: "/video-tutorial", changeFrequency: "monthly", priority: 0.65 },
    { path: "/shipping", changeFrequency: "yearly", priority: 0.5 },
    { path: "/refund", changeFrequency: "yearly", priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  ];

type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedSitemapEntries(
  pathWithoutLocale: string,
  meta: Omit<SitemapEntry, "url" | "alternates">,
): SitemapEntry[] {
  const languages = storefrontHreflangLanguages(pathWithoutLocale);
  return routing.locales.map((locale) => ({
    url: languages[locale],
    ...meta,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((e) =>
    localizedSitemapEntries(e.path, {
      lastModified,
      changeFrequency: e.changeFrequency,
      priority: e.priority,
    }),
  );

  const seriesEntries: MetadataRoute.Sitemap = seriesList.flatMap((s) =>
    localizedSitemapEntries(`/series/${encodeURIComponent(s.slug)}`, {
      lastModified,
      changeFrequency: "weekly",
      priority: 0.85,
    }),
  );

  const products = await getMergedCatalogProducts();
  const productEntries: MetadataRoute.Sitemap = products.flatMap((p) =>
    localizedSitemapEntries(`/product/${encodeURIComponent(p.slug)}`, {
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const blogPosts = await listPublishedBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) =>
    localizedSitemapEntries(`/blog/${encodeURIComponent(post.slug)}`, {
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  return [...staticEntries, ...seriesEntries, ...productEntries, ...blogEntries];
}
