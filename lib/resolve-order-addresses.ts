import {
  formatCheckoutAddressValidationEnglish,
  isAddressRecordComplete,
  mergeDerivedLogisticsZone,
  validateCheckoutAddressForm,
  type CheckoutAddressForm,
  type CheckoutAddressRecord,
} from "@/lib/checkout-address";

function checkoutFormFromRecord(record: CheckoutAddressRecord): CheckoutAddressForm {
  return {
    firstName: record.firstName ?? "",
    lastName: record.lastName ?? "",
    company: record.company ?? "",
    line1: record.line1 ?? "",
    line2: record.line2 ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
    postalCode: record.postalCode ?? "",
    country: record.country ?? "",
    logisticsZone: record.logisticsZone ?? "",
    phone: record.phone ?? "",
    taxId: record.taxId ?? "",
  };
}

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
    const billCheck = validateCheckoutAddressForm(checkoutFormFromRecord(b));
    if (!billCheck.ok) {
      return {
        ok: false,
        error: `Billing: ${formatCheckoutAddressValidationEnglish(billCheck.errorKey)}`,
      };
    }
    const shipCheck = validateCheckoutAddressForm(checkoutFormFromRecord(s));
    if (!shipCheck.ok) {
      return {
        ok: false,
        error: `Shipping: ${formatCheckoutAddressValidationEnglish(shipCheck.errorKey)}`,
      };
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
    const oneCheck = validateCheckoutAddressForm(checkoutFormFromRecord(single));
    if (!oneCheck.ok) {
      return {
        ok: false,
        error: formatCheckoutAddressValidationEnglish(oneCheck.errorKey),
      };
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
