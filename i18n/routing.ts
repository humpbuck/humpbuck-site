import { defineRouting } from "next-intl/routing";

/**
 * Supported storefront locales. Default `en` keeps existing unprefixed URLs; others use `/{locale}/...`.
 * `localeCookie: false` + `localeDetection: false` keeps URLs canonical and prevents
 * `Set-Cookie: NEXT_LOCALE=...` on every response (which blocks edge/CDN HTML caching).
 */
export const routing = defineRouting({
  locales: ["ar", "de", "en", "es", "fr", "he", "hu", "it", "ja", "ko", "nl", "pt", "ru"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeCookie: false,
  localeDetection: false,
});
