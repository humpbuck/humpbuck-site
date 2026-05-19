import { defineRouting } from "next-intl/routing";

/** Supported storefront locales. Default `en` keeps existing unprefixed URLs; others use `/{locale}/...`. */
export const routing = defineRouting({
  locales: ["ar", "de", "en", "es", "fr", "he", "hu", "it", "ja", "ko", "nl", "pt", "ru"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
