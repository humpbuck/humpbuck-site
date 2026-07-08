import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { routing } from "./i18n/routing";
import { ADMIN_PATH } from "./lib/admin-path";

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

const legacySeriesAstralRedirects = routing.locales.map((locale) =>
  locale === routing.defaultLocale
    ? {
        source: "/series/astral",
        destination: "/series/rd-astral",
        permanent: true as const,
      }
    : {
        source: `/${locale}/series/astral`,
        destination: `/${locale}/series/rd-astral`,
        permanent: true as const,
      },
);

const legacyShopAstralQueryRedirects = routing.locales.map((locale) =>
  locale === routing.defaultLocale
    ? {
        source: "/shop",
        has: [{ type: "query" as const, key: "series", value: "astral" }],
        destination: "/product?series=rd-astral",
        permanent: true as const,
      }
    : {
        source: `/${locale}/shop`,
        has: [{ type: "query" as const, key: "series", value: "astral" }],
        destination: `/${locale}/product?series=rd-astral`,
        permanent: true as const,
      },
);

const legacyShopToProductRedirects = routing.locales.map((locale) =>
  locale === routing.defaultLocale
    ? {
        source: "/shop",
        destination: "/product",
        permanent: true as const,
      }
    : {
        source: `/${locale}/shop`,
        destination: `/${locale}/product`,
        permanent: true as const,
      },
);

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    optimizePackageImports: ["lucide-react", "stripe"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "humpbuck.com" }],
        destination: "https://www.humpbuck.com/:path*",
        permanent: true,
      },
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
      ...legacySeriesAstralRedirects,
      ...legacyShopAstralQueryRedirects,
      ...legacyShopToProductRedirects,
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

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
