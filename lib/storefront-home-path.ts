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
