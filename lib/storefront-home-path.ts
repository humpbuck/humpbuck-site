import { routing } from "@/i18n/routing";

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

/** Catalog (`/product`) and PDP (`/product/[slug]`) — same announcement bar as home. */
export function isStorefrontProductPathname(pathname: string): boolean {
  return pathname === "/product" || pathname.startsWith("/product/");
}

export function isStorefrontAnnouncementPathname(pathname: string): boolean {
  return isStorefrontHomePathname(pathname) || isStorefrontProductPathname(pathname);
}
