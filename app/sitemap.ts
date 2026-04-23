import type { MetadataRoute } from "next";
import { getAllProducts, seriesList } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/seo";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((e) => ({
    url: `${base}${e.path}`,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));

  const seriesEntries: MetadataRoute.Sitemap = seriesList.map((s) => ({
    url: `${base}/series/${encodeURIComponent(s.slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const products = getAllProducts();
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${encodeURIComponent(p.slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...seriesEntries, ...productEntries];
}
