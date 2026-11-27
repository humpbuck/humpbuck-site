import type { AbstractIntlMessages } from "next-intl";

/** Namespaces needed by shared storefront client components across all public pages. */
export const BASE_CLIENT_NAMESPACES = [
  "Navigation",
  "Cart",
  "Common",
  "DisplayCurrency",
  "Floating",
  "LocaleSwitcher",
  "WhatsAppFab",
  "Newsletter",
  "ContactForm",
  "Product",
  "Home",
  "Shop",
  "Reviews",
  "Auth",
] as const;

/** Namespaces needed inside `/checkout/**` client components. */
export const CHECKOUT_CLIENT_NAMESPACES = [
  ...BASE_CLIENT_NAMESPACES,
  "Checkout",
  "CheckoutAddress",
  "CheckoutShipping",
  "CheckoutShippingMethod",
  "Payment",
  "TaxId",
] as const;

/** Namespaces needed inside `/account/**` client components. */
export const ACCOUNT_CLIENT_NAMESPACES = [
  ...BASE_CLIENT_NAMESPACES,
  "Account",
  "AccountCancel",
  "AccountConfirm",
  "AccountReview",
  "CheckoutAddress",
  "TaxId",
] as const;

/** Namespaces needed inside `/oem-odm` client components. */
export const OEM_ODM_CLIENT_NAMESPACES = [
  ...BASE_CLIENT_NAMESPACES,
  "OemOdmPage",
] as const;

/** Pick only the specified top-level message namespaces for client hydration. */
export function pickClientMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const ns of namespaces) {
    if (ns in messages && messages[ns] !== undefined) {
      picked[ns] = messages[ns];
    }
  }
  return picked;
}
