import { routing } from "@/i18n/routing";

/**
 * Homepage CMS (`SiteHomeContent`) stores one language (English) from admin.
 * For non-default locales, prefer `messages/{locale}.json` so JA/DE/etc. are not
 * forced to show the same English strings saved in D1.
 */
export function resolveHomeCmsText(
  locale: string,
  cmsValue: string | undefined | null,
  i18nValue: string,
): string {
  const cms = String(cmsValue ?? "").trim();
  const i18n = String(i18nValue ?? "").trim();
  if (locale !== routing.defaultLocale) {
    return i18n || cms;
  }
  return cms || i18n;
}
