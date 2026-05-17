/**
 * Fixed locale for customer UI, admin UI, and transactional emails.
 * Do not pass `undefined` to `Intl` formatters — that follows the visitor's
 * browser and breaks consistent English copy.
 */
export const SITE_LOCALE = "en-US" as const;

/** BCP 47 tag for `Intl` formatters from the storefront `[locale]` segment. */
export function intlLocaleFromAppLocale(appLocale: string): string {
  return appLocale === "es" ? "es-ES" : "en-US";
}
