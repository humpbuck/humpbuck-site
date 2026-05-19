import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";

/**
 * Absolute URLs for `metadata.alternates.languages` (hreflang).
 * `pathWithoutLocale` must match the URL path with no locale segment, e.g. `/`, `/shop`,
 * `/product/digitemp-2301` (use the same encoding as canonical paths).
 */
export function storefrontHreflangLanguages(pathWithoutLocale: string): Record<string, string> {
  const base = getSiteUrl().replace(/\/$/, "");
  const norm =
    !pathWithoutLocale || pathWithoutLocale === "/"
      ? "/"
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;

  const enHref = norm === "/" ? `${base}/` : `${base}${norm}`;
  const esHref = norm === "/" ? `${base}/es` : `${base}/es${norm}`;
  const ptHref = norm === "/" ? `${base}/pt` : `${base}/pt${norm}`;

  const xDefault =
    routing.defaultLocale === "es" ? esHref : routing.defaultLocale === "pt" ? ptHref : enHref;

  return {
    "x-default": xDefault,
    en: enHref,
    es: esHref,
    pt: ptHref,
  };
}
