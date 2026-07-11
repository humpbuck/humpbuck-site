import {
  CHECKOUT_COUPON_I18N_KEYS,
  type CheckoutCouponErrorCode,
} from "@/lib/checkout-coupon-errors";
import {
  CHECKOUT_ORDER_ERROR_CODES,
  isCheckoutOrderAddressError,
} from "@/lib/checkout-order-errors";

type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

export function resolveCheckoutCouponErrorMessage(
  errorCode: string | undefined,
  t: TranslateFn,
): string {
  if (errorCode && errorCode in CHECKOUT_COUPON_I18N_KEYS) {
    return t(CHECKOUT_COUPON_I18N_KEYS[errorCode as CheckoutCouponErrorCode]);
  }
  return t("couponInvalid");
}

export function resolveCheckoutOrderErrorMessage(
  data: unknown,
  tCheckout: TranslateFn,
  tAddress: TranslateFn,
): string {
  if (isCheckoutOrderAddressError(data)) {
    const scopeLabel =
      data.addressScope === "billing"
        ? tCheckout("billingTitle")
        : tCheckout("deliveryTitle");
    const fieldMessage = tAddress(`validation.${data.validationKey}`);
    return `${scopeLabel}: ${fieldMessage}`;
  }

  if (data && typeof data === "object" && "errorCode" in data) {
    const errorCode = (data as { errorCode?: string }).errorCode;
    if (errorCode === CHECKOUT_ORDER_ERROR_CODES.MISSING_FIELDS) {
      return tCheckout("completeDetailsToPay");
    }
  }

  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error.trim();
  }

  return tCheckout("draftOrderFailed");
}
