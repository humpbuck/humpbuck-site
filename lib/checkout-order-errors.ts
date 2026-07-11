import type { CheckoutAddressValidationErrorKey } from "@/lib/checkout-address";

export const CHECKOUT_ORDER_ERROR_CODES = {
  ADDRESS_INVALID: "ADDRESS_INVALID",
  MISSING_FIELDS: "MISSING_FIELDS",
  INVALID_JSON: "INVALID_JSON",
} as const;

export type CheckoutOrderAddressScope = "shipping" | "billing";

export type CheckoutOrderAddressError = {
  errorCode: typeof CHECKOUT_ORDER_ERROR_CODES.ADDRESS_INVALID;
  addressScope: CheckoutOrderAddressScope;
  validationKey: CheckoutAddressValidationErrorKey;
};

export function isCheckoutOrderAddressError(
  data: unknown,
): data is CheckoutOrderAddressError {
  if (!data || typeof data !== "object") return false;
  const row = data as Record<string, unknown>;
  return (
    row.errorCode === CHECKOUT_ORDER_ERROR_CODES.ADDRESS_INVALID &&
    (row.addressScope === "shipping" || row.addressScope === "billing") &&
    typeof row.validationKey === "string"
  );
}
