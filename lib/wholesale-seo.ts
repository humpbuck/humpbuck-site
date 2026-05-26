import { defaultOgImage, absoluteOgImageUrl, getSiteUrl } from "@/lib/seo";
import { R2 } from "@/lib/r2";
import { storefrontLocalizedPath } from "@/lib/storefront-hreflang";
import { routing } from "@/i18n/routing";
import {
  wholesaleListingPosterUrl,
  wholesaleListingPublicPath,
  type WholesaleListingRow,
} from "@/lib/wholesale-listing-shared";

/** Primary share image for `/wholesale` (Facebook, Twitter, iMessage previews). */
export function wholesaleIndexOgImage(): string {
  return R2.wholesale.seoOgWebp;
}

export function resolveWholesaleOgImage(_listings: WholesaleListingRow[]): string {
  return wholesaleIndexOgImage();
}

export function resolveWholesaleListingOgImage(listing: WholesaleListingRow): string {
  const poster = wholesaleListingPosterUrl(listing.mediaUrls);
  return poster ? absoluteOgImageUrl(poster) : defaultOgImage.url;
}

export function wholesaleIndexPageUrl(locale: string): string {
  const loc = locale as (typeof routing.locales)[number];
  const base = getSiteUrl();
  const path = storefrontLocalizedPath("/wholesale", loc);
  return `${base}${path}`;
}

export function wholesaleListingPageUrl(slug: string, locale: string): string {
  const loc = locale as (typeof routing.locales)[number];
  const base = getSiteUrl();
  const path = storefrontLocalizedPath(wholesaleListingPublicPath(slug), loc);
  return `${base}${path}`;
}
