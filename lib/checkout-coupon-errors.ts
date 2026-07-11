export const CHECKOUT_COUPON_ERROR_CODES = {
  REQUIRED: "COUPON_REQUIRED",
  NOT_FOUND: "COUPON_NOT_FOUND",
  INACTIVE: "COUPON_INACTIVE",
  NOT_ACTIVE_YET: "COUPON_NOT_ACTIVE_YET",
  EXPIRED: "COUPON_EXPIRED",
  USAGE_LIMIT: "COUPON_USAGE_LIMIT",
  VALIDATE_FAILED: "COUPON_VALIDATE_FAILED",
} as const;

export type CheckoutCouponErrorCode =
  (typeof CHECKOUT_COUPON_ERROR_CODES)[keyof typeof CHECKOUT_COUPON_ERROR_CODES];

/** Maps API `errorCode` → `Checkout` message key. */
export const CHECKOUT_COUPON_I18N_KEYS: Record<CheckoutCouponErrorCode, string> = {
  COUPON_REQUIRED: "couponRequired",
  COUPON_NOT_FOUND: "couponNotFound",
  COUPON_INACTIVE: "couponInactive",
  COUPON_NOT_ACTIVE_YET: "couponNotActiveYet",
  COUPON_EXPIRED: "couponExpired",
  COUPON_USAGE_LIMIT: "couponUsageLimit",
  COUPON_VALIDATE_FAILED: "couponValidateFailed",
};
