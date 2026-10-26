import type { NextConfig } from "next";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";
import { routing } from "./i18n/routing";
import { ADMIN_PATH } from "./lib/admin-path";

const require = createRequire(import.meta.url);
require("./scripts/load-project-env.mjs").applyLocalDatabaseEnvOverride();

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * R2: allow `next/image` for the default r2.dev host and for any
 * `NEXT_PUBLIC_R2_PUBLIC_BASE` custom domain. Without the matching `hostname` in
 * `images.remotePatterns`, all product/cart images fail and the PDP carousel can
 * render empty after error handling.
 */
function r2PublicImagePatterns(): { protocol: "https"; hostname: string; pathname: string }[] {
  const defaultHost = "pub-c8982b0d0821469baad86145989f3f64.r2.dev";
  const hosts = new Set<string>([defaultHost, "assets.humpbuck.com"]);
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (base) {
    try {
      const u = new URL(base);
      if (u.hostname) hosts.add(u.hostname);
    } catch {
      // invalid URL — keep defaults only
    }
  }
  return Array.from(hosts).map((hostname) => ({
    protocol: "https" as const,
    hostname,
    pathname: "/**",
  }));
}

/** Old `/series/{slug}` landing pages → `/products/…` collections. */
const LEGACY_SERIES_PAGE_DEST: Record<string, string> = {
  digitemp: "/products/ana-digi",
  "digi-temp": "/products/ana-digi",
  tonneau: "/products",
  "rm-tonneau": "/products",
  "rd-astral": "/products",
  astral: "/products",
};

/** Former SEO collection URLs → `/products/{category}`. */
const LEGACY_WATCH_COLLECTION_PATHS: Record<string, string> = {
  "/ana-digi-watches": "/products/ana-digi",
  "/digital-watches": "/products/digital",
  "/analog-watches": "/products/analog",
  "/automatic-watches": "/products/automatic",
  "/watches": "/products",
};

const legacyWatchCollectionRedirects = Object.entries(
  LEGACY_WATCH_COLLECTION_PATHS,
).flatMap(([from, to]) =>
  routing.locales.map((locale) =>
    locale === routing.defaultLocale
      ? {
          source: from,
          destination: to,
          permanent: true as const,
        }
      : {
          source: `/${locale}${from}`,
          destination: `/${locale}${to}`,
          permanent: true as const,
        },
  ),
);

const legacySeriesPageRedirects = Object.entries(LEGACY_SERIES_PAGE_DEST).flatMap(
  ([slug, destination]) =>
    routing.locales.map((locale) =>
      locale === routing.defaultLocale
        ? {
            source: `/series/${slug}`,
            destination,
            permanent: true as const,
          }
        : {
            source: `/${locale}/series/${slug}`,
            destination: `/${locale}${destination}`,
            permanent: true as const,
          },
    ),
);

/** Legacy `?series=` / `?category=` on /product|/shop → `/products/…`. */
type LegacyQueryRedirect = {
  path: "/product" | "/shop";
  key: "series" | "category" | "movement" | "profile";
  value: string;
  destPath: string;
};

const legacyShopQueryRedirects: LegacyQueryRedirect[] = [
  { path: "/product", key: "series", value: "ana-digi", destPath: "/products/ana-digi" },
  { path: "/product", key: "series", value: "digitemp", destPath: "/products/ana-digi" },
  { path: "/product", key: "series", value: "quartz", destPath: "/products/ana-digi" },
  { path: "/product", key: "series", value: "digital", destPath: "/products/digital" },
  { path: "/product", key: "series", value: "analog", destPath: "/products/analog" },
  { path: "/product", key: "series", value: "automatic", destPath: "/products/automatic" },
  { path: "/product", key: "series", value: "mechanical", destPath: "/products/automatic" },
  { path: "/product", key: "series", value: "ultra-thin", destPath: "/products" },
  { path: "/product", key: "category", value: "cat_ana-digi", destPath: "/products/ana-digi" },
  { path: "/product", key: "category", value: "cat_quartz", destPath: "/products/ana-digi" },
  { path: "/product", key: "category", value: "quartz", destPath: "/products/ana-digi" },
  { path: "/product", key: "category", value: "ana-digi", destPath: "/products/ana-digi" },
  { path: "/product", key: "category", value: "digitemp", destPath: "/products/ana-digi" },
  { path: "/product", key: "category", value: "cat_ultra_thin", destPath: "/products" },
  { path: "/product", key: "category", value: "ultra-thin", destPath: "/products" },
  { path: "/product", key: "category", value: "cat_automatic", destPath: "/products/automatic" },
  { path: "/product", key: "category", value: "cat_mechanical", destPath: "/products/automatic" },
  { path: "/product", key: "category", value: "mechanical", destPath: "/products/automatic" },
  { path: "/product", key: "category", value: "automatic", destPath: "/products/automatic" },
  { path: "/product", key: "category", value: "cat_digital", destPath: "/products/digital" },
  { path: "/product", key: "category", value: "digital", destPath: "/products/digital" },
  { path: "/product", key: "category", value: "cat_analog", destPath: "/products/analog" },
  { path: "/product", key: "category", value: "analog", destPath: "/products/analog" },
  { path: "/product", key: "movement", value: "quartz", destPath: "/products/ana-digi" },
  { path: "/product", key: "movement", value: "mechanical", destPath: "/products/automatic" },
  { path: "/product", key: "profile", value: "ultra-thin", destPath: "/products" },
  { path: "/shop", key: "series", value: "astral", destPath: "/products" },
  { path: "/shop", key: "series", value: "digitemp", destPath: "/products/ana-digi" },
  { path: "/shop", key: "series", value: "rd-astral", destPath: "/products" },
  { path: "/shop", key: "series", value: "tonneau", destPath: "/products" },
  { path: "/shop", key: "series", value: "ana-digi", destPath: "/products/ana-digi" },
  { path: "/shop", key: "series", value: "mechanical", destPath: "/products/automatic" },
];

const legacyShopSeriesQueryRedirects = legacyShopQueryRedirects.flatMap(
  ({ path, key, value, destPath }) =>
    routing.locales.map((locale) => {
      const source = locale === routing.defaultLocale ? path : `/${locale}${path}`;
      const destination =
        locale === routing.defaultLocale ? destPath : `/${locale}${destPath}`;
      return {
        source,
        has: [{ type: "query" as const, key, value }],
        destination,
        permanent: true as const,
      };
    }),
);

/** Singular `/product` (+ nested) and `/shop` → plural `/products`. */
const legacyCatalogToProductsRedirects = routing.locales.flatMap((locale) => {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return [
    {
      source: `${prefix}/product/:path*`,
      destination: `${prefix}/products/:path*`,
      permanent: true as const,
    },
    {
      source: `${prefix}/product`,
      destination: `${prefix}/products`,
      permanent: true as const,
    },
    {
      source: `${prefix}/shop`,
      destination: `${prefix}/products`,
      permanent: true as const,
    },
  ];
});


const cfWorkersBuild = process.env.CF_WORKERS_BUILD === "1";
const cfEmptyModule = "./lib/cf-empty-module.ts";
/** Prefer config-file location over `process.cwd()` so Turbopack root stays on this drive. */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
    ...(cfWorkersBuild
      ? {
          resolveAlias: {
            "@vercel/analytics/react": cfEmptyModule,
            "@vercel/speed-insights/next": cfEmptyModule,
          },
        }
      : {}),
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    optimizePackageImports: ["lucide-react", "stripe", "country-state-city"],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: ADMIN_PATH,
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: `${ADMIN_PATH}/:path*`,
        permanent: true,
      },
      ...legacyWatchCollectionRedirects,
      ...legacySeriesPageRedirects,
      ...legacyShopSeriesQueryRedirects,
      ...legacyCatalogToProductsRedirects,
    ];
  },
  images: {
    qualities: [60, 62, 66, 68, 75, 80, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
        pathname: "/**",
      },
      ...r2PublicImagePatterns(),
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

import("@opennextjs/cloudflare").then(async (m) => {
  // HUMPBUCK_D1_REMOTE=1 → dev server uses production Cloudflare D1 (not local dev.db).
  // See .env.example — D1 has no DATABASE_URL connection string.
  const useRemoteD1 = process.env.HUMPBUCK_D1_REMOTE === "1";
  await m.initOpenNextCloudflareForDev(
    useRemoteD1
      ? { remoteBindings: true, persist: false }
      : { remoteBindings: false },
  );
  require("./scripts/load-project-env.mjs").applyLocalDatabaseEnvOverride();
});
