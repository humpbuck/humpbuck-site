import type { MetadataRoute } from "next";
import { seriesList } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";

/** Prefix storefront paths for sitemap URLs (`as-needed`: default locale stays unprefixed). */
function localizedPath(path: string, locale: (typeof routing.locales)[number]): string {
  if (locale === routing.defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

/** Regenerate periodically so new PDP URLs appear without a full redeploy. */
export const revalidate = 3600;

const STATIC_PATHS: {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/shop", changeFrequency: "daily", priority: 0.95 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/wholesale", changeFrequency: "monthly", priority: 0.65 },
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
      url: `${base}${localizedPath(e.path, locale)}`,
      lastModified,
      changeFrequency: e.changeFrequency,
      priority: e.priority,
    })),
  );

  const seriesEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    seriesList.map((s) => ({
      url: `${base}${localizedPath(`/series/${encodeURIComponent(s.slug)}`, locale)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  );

  const products = await getMergedCatalogProducts();
  const productEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    products.map((p) => ({
      url: `${base}${localizedPath(`/product/${encodeURIComponent(p.slug)}`, locale)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  return [...staticEntries, ...seriesEntries, ...productEntries];
}
