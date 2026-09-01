import type { MetadataRoute } from "next";
import { readCatalogBuildSlugs } from "@/lib/catalog-build-slugs";
import { readBlogBuildSlugs } from "@/lib/blog-build-slugs";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { listPublishedBlogPosts } from "@/lib/blog-posts";
import { productHref } from "@/lib/product-path";
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
    { path: "/watches", changeFrequency: "daily", priority: 0.95 },
    { path: "/ana-digi-watches", changeFrequency: "weekly", priority: 0.9 },
    { path: "/digital-watches", changeFrequency: "weekly", priority: 0.9 },
    { path: "/analog-watches", changeFrequency: "weekly", priority: 0.9 },
    { path: "/automatic-watches", changeFrequency: "weekly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/oem-odm", changeFrequency: "monthly", priority: 0.75 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
    { path: "/video-tutorial", changeFrequency: "weekly", priority: 0.75 },
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

/** Same path resolution as PDP `generateStaticParams` — D1 first, build JSON when cf-build has no binding. */
async function resolveProductPaths(): Promise<string[]> {
  const paths = new Set<string>();
  try {
    for (const product of await getMergedCatalogProducts()) {
      if (!product.slug.trim()) continue;
      paths.add(productHref(product));
    }
  } catch (err) {
    console.error("[sitemap] catalog load failed.", err);
  }
  for (const slug of readCatalogBuildSlugs()) {
    // Build fallback without categoryId → ana-digi (matches generateStaticParams).
    paths.add(productHref({ slug }));
  }
  return [...paths];
}

/** Same slug resolution as blog `generateStaticParams`. */
async function resolveBlogEntries(): Promise<{ slug: string; lastModified: Date }[]> {
  const bySlug = new Map<string, Date>();
  const fallbackDate = new Date();
  try {
    for (const post of await listPublishedBlogPosts()) {
      if (post.slug.trim()) {
        bySlug.set(post.slug.trim(), post.updatedAt);
      }
    }
  } catch (err) {
    console.error("[sitemap] blog load failed.", err);
  }
  for (const slug of readBlogBuildSlugs()) {
    if (!bySlug.has(slug)) bySlug.set(slug, fallbackDate);
  }
  return [...bySlug.entries()].map(([slug, lastModified]) => ({ slug, lastModified }));
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

  const productPaths = await resolveProductPaths();
  const productEntries: MetadataRoute.Sitemap = productPaths.flatMap((path) =>
    localizedSitemapEntries(path, {
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const blogEntriesList = await resolveBlogEntries();
  const blogEntries: MetadataRoute.Sitemap = blogEntriesList.flatMap(({ slug, lastModified: postLastModified }) =>
    localizedSitemapEntries(`/blog/${encodeURIComponent(slug)}`, {
      lastModified: postLastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  return [...staticEntries, ...productEntries, ...blogEntries];
}
