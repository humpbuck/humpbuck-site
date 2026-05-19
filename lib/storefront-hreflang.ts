import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";

/** Path rules for `localePrefix: as-needed` (default locale unprefixed). */
export function storefrontLocalizedPath(
  path: string,
  locale: (typeof routing.locales)[number],
): string {
  if (locale === routing.defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

/**
 * Absolute URLs for `metadata.alternates.languages` (hreflang).
 * `pathWithoutLocale` must match the URL path with no locale segment, e.g. `/`, `/shop`,
 * `/product/digitemp-2301` (use the same encoding as canonical paths).
 */
export function storefrontHreflangLanguages(
  pathWithoutLocale: string,
): Record<string, string> {
  const base = getSiteUrl().replace(/\/$/, "");
  const norm =
    !pathWithoutLocale || pathWithoutLocale === "/"
      ? "/"
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;

  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    const path = storefrontLocalizedPath(norm, locale);
    languages[locale] = path === "/" ? `${base}/` : `${base}${path}`;
  }

  languages["x-default"] =
    languages[routing.defaultLocale] ?? languages.en ?? `${base}/`;

  return languages;
}
