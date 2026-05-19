import { defineRouting } from "next-intl/routing";

/** Supported storefront locales. Default `en` keeps existing unprefixed URLs; others use `/{locale}/...`. */
export const routing = defineRouting({
  locales: ["en", "es", "pt", "ru", "fr", "it", "nl", "hu", "ko", "de", "ja", "he", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
