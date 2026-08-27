import { routing } from "@/i18n/routing";
import { STOREFRONT_WATCH_COLLECTION_PATHS } from "@/lib/storefront-watch-categories";

/** Home URL for full-page redirects like `signOut` (default locale stays unprefixed). */
export function storefrontHomePath(locale: string): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

export function isStorefrontHomePathname(pathname: string): boolean {
  if (pathname === "/") return true;
  const match = pathname.match(/^\/([^/]+)$/);
  if (!match) return false;
  return (routing.locales as readonly string[]).includes(match[1]);
}

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(
    /^\/(ar|de|en|es|fr|he|hu|it|ja|ko|nl|pt|ru)(?=\/)/,
    "",
  );
}

/** Catalog collections + PDP (`/product/[slug]`). */
export function isStorefrontProductPathname(pathname: string): boolean {
  const bare = stripLocalePrefix(pathname);
  if (bare === "/product" || bare.startsWith("/product/")) return true;
  return (STOREFRONT_WATCH_COLLECTION_PATHS as readonly string[]).includes(bare);
}

export function isStorefrontAnnouncementPathname(pathname: string): boolean {
  return (
    isStorefrontHomePathname(pathname) || isStorefrontProductPathname(pathname)
  );
}
