import { defineRouting } from "next-intl/routing";

/** Supported storefront locales. Default `en` keeps existing unprefixed URLs; `es` → `/es/...`, `pt` → `/pt/...`. */
export const routing = defineRouting({
  locales: ["en", "es", "pt"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
