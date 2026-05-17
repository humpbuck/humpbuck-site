import { defineRouting } from "next-intl/routing";

/** Supported storefront locales. Default `en` keeps existing unprefixed URLs; Spanish uses `/es/...`. */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
