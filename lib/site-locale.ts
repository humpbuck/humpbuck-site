/**
 * Fixed locale for customer UI, admin UI, and transactional emails.
 * Do not pass `undefined` to `Intl` formatters — that follows the visitor's
 * browser and breaks consistent English copy.
 */
export const SITE_LOCALE = "en-US" as const;

/** BCP 47 tag for `Intl` formatters from the storefront `[locale]` segment. */
const INTL_BY_APP_LOCALE: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  ru: "ru-RU",
  fr: "fr-FR",
  it: "it-IT",
  nl: "nl-NL",
  hu: "hu-HU",
  ko: "ko-KR",
  de: "de-DE",
  ja: "ja-JP",
  he: "he-IL",
  ar: "ar-SA",
};

export function intlLocaleFromAppLocale(appLocale: string): string {
  return INTL_BY_APP_LOCALE[appLocale] ?? "en-US";
}
