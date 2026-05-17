import { routing } from "@/i18n/routing";

/** Home URL for full-page redirects like `signOut` (default locale stays unprefixed). */
export function storefrontHomePath(locale: string): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}
