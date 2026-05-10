import {
  isAddressRecordComplete,
  mergeDerivedLogisticsZone,
  validateCheckoutAddressForm,
} from "@/lib/checkout-address";

/**
 * Builds `billingJson` / `shippingJson` for Order.create.
 * Accepts either both addresses, or a single legacy `shipping` (or `billing`) object used for both.
 */
export function resolveOrderAddressJson(body: {
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
}):
  | { ok: true; billingJson: string | undefined; shippingJson: string | undefined }
  | { ok: false; error: string } {
  const b = body.billing;
  const s = body.shipping;

  if (b && s) {
    if (!isAddressRecordComplete(b))
      return { ok: false, error: "Billing address is incomplete" };
    if (!isAddressRecordComplete(s))
      return { ok: false, error: "Shipping address is incomplete" };
    const billCheck = validateCheckoutAddressForm(b as any);
    if (!billCheck.ok) {
      return { ok: false, error: `Billing: ${billCheck.error}` };
    }
    const shipCheck = validateCheckoutAddressForm(s as any);
    if (!shipCheck.ok) {
      return { ok: false, error: `Shipping: ${shipCheck.error}` };
    }
    const ship = { ...s };
    mergeDerivedLogisticsZone(ship);
    return {
      ok: true,
      billingJson: JSON.stringify(b),
      shippingJson: JSON.stringify(ship),
    };
  }

  const single = s ?? b;
  if (single && isAddressRecordComplete(single)) {
    const oneCheck = validateCheckoutAddressForm(single as any);
    if (!oneCheck.ok) {
      return { ok: false, error: oneCheck.error };
    }
    const one = { ...single };
    mergeDerivedLogisticsZone(one);
    const j = JSON.stringify(one);
    return { ok: true, billingJson: j, shippingJson: j };
  }

  return {
    ok: false,
    error: "Billing and shipping addresses are required",
  };
}
