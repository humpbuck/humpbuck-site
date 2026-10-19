import { revalidatePath, revalidateTag } from "next/cache";
import { routing } from "@/i18n/routing";

/** Storefront pages and DB caches do not time-expire — only admin saves, webhooks, and deploys invalidate them. */

/** Bust the storefront announcement data cache after admin save. */
export function revalidateSiteAnnouncement(): void {
  revalidateTag("site-announcement", { expire: 0 });
}

/** Bust homepage CMS copy cache after admin save. */
export function revalidateSiteHomeContent(): void {
  revalidateTag("site-home-content", { expire: 0 });
}

/** Bust homepage featured-coupon cache after admin coupon save. */
export function revalidateHomepageFeaturedCoupon(): void {
  revalidateTag("homepage-featured-coupon", { expire: 0 });
}

/** Bust storefront video tutorial CMS cache after admin save. */
export function revalidateSiteVideoTutorial(): void {
  revalidateTag("site-video-tutorial", { expire: 0 });
}

/** Bust header/footer collection nav cache. */
export function revalidateStorefrontCategories(): void {
  revalidateTag("storefront-categories", { expire: 0 });
}

/** ISR + data-cache bust after homepage admin saves. */
export function revalidateStorefrontHomepage(): void {
  revalidateSiteHomeContent();
  revalidateHomepageFeaturedCoupon();
  revalidateStorefrontPath("/");
}

/** Revalidate a storefront pathname for every `[locale]` segment (`as-needed` + `/es/...`). */
export function revalidateStorefrontPath(
  pathname: string,
  type?: "page" | "layout",
): void {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  revalidatePath(p, type);
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    revalidatePath(`/${locale}${p}`, type);
  }
}

/** Paths that share the storefront shell (announcement bar + header). */
const STOREFRONT_SHELL_PATHS = [
  "/",
  "/watches",
  "/ana-digi-watches",
  "/digital-watches",
  "/analog-watches",
  "/automatic-watches",
  "/blog",
  "/video-tutorial",
] as const;

/** Revalidate main storefront pages (all locales) after shell-wide changes (e.g. announcement bar). */
export function revalidateStorefrontShell(): void {
  revalidateStorefrontCategories();
  for (const pathname of STOREFRONT_SHELL_PATHS) {
    // Announcement bar lives in `(site)/layout.tsx` — must bust layout cache, not page-only.
    revalidateStorefrontPath(pathname, "layout");
  }
}

/** Regenerate sitemap.xml after catalog or blog URLs change. */
export function revalidateSitemap(): void {
  revalidatePath("/sitemap.xml");
}
