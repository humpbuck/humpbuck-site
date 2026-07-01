import type { MetadataRoute } from "next";
import { ADMIN_PATH } from "@/lib/admin-path";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          `${ADMIN_PATH}/`,
          "/admin/",
          "/account/",
          "/auth/",
          "/checkout",
          "/cart",
          "/*/checkout",
          "/*/cart",
          "/newsletter/confirmed",
          "/*/newsletter/confirmed",
          "/unsubscribe",
          "/*/unsubscribe",
          "/*/account/",
          "/*/auth/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
