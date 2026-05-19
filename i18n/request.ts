import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const base = (await import(`../messages/${locale}.json`)).default;
  const extra = (await import(`../messages/storefront-extra.${locale}.json`)).default;
  const productCopy = (await import(`../messages/product-copy.${locale}.json`)).default;
  const policies = (await import(`../messages/policies.${locale}.json`)).default;
  const enBase =
    locale === "en"
      ? base
      : (await import("../messages/en.json")).default;

  return {
    locale,
    messages: {
      ...base,
      ...extra,
      ...productCopy,
      ...policies,
      ContactForm: base.ContactForm ?? enBase.ContactForm,
    },
  };
});
