/**
 * Checkout billing / shipping payloads stored as JSON on Order (same shape as WooCommerce-style fields).
 */

import { DEFAULT_CHECKOUT_COUNTRY } from "@/lib/checkout-regions";
import { isPostalRequiredForCheckout } from "@/lib/checkout-address-consistency";
import {
  isCityRequiredForCountry,
  isStateRequiredForCountry,
} from "@/lib/checkout-state-options";
import {
  countryLabelToIso2,
  yanwenCountryUsesZones,
} from "@/lib/logistics-estimate";
import { deriveYanwenLaneZoneDigit } from "@/lib/yanwen-postcode-zones";

export type CheckoutAddressForm = {
  firstName: string;
  lastName: string;
  company: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  /** Derived for AU/CA from postal code (Yanwen + Cainiao AU pricing); not user-edited. */
  logisticsZone: string;
  phone: string;
};

export function emptyCheckoutAddress(): CheckoutAddressForm {
  return {
    firstName: "",
    lastName: "",
    company: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: DEFAULT_CHECKOUT_COUNTRY,
    logisticsZone: "",
    phone: "",
  };
}

/** Hydrate checkout form from order `shippingJson` / `billingJson` record keys. */
export function checkoutFormFromOrderRecord(
  r: Record<string, string> | null | undefined,
): CheckoutAddressForm {
  const e = emptyCheckoutAddress();
  if (!r) return e;
  return {
    firstName: (r.firstName ?? "").trim(),
    lastName: (r.lastName ?? "").trim(),
    company: (r.company ?? "").trim(),
    line1: (r.line1 ?? "").trim(),
    line2: (r.line2 ?? "").trim(),
    city: (r.city ?? "").trim(),
    state: (r.state ?? "").trim(),
    postalCode: (r.postalCode ?? r.zip ?? "").trim(),
    country: (r.country ?? "").trim() || e.country,
    logisticsZone: (r.logisticsZone ?? "").trim(),
    phone: (r.phone ?? "").trim(),
  };
}

export function addressFormToRecord(
  a: CheckoutAddressForm,
): Record<string, string> {
  const fullName = [a.firstName, a.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  const o: Record<string, string> = {
    firstName: a.firstName.trim(),
    lastName: a.lastName.trim(),
    fullName,
    line1: a.line1.trim(),
    line2: a.line2.trim(),
    city: a.city.trim(),
    state: a.state.trim(),
    postalCode: a.postalCode.trim(),
    country: a.country.trim(),
    phone: a.phone.trim(),
  };
  if (a.company.trim()) o.company = a.company.trim();
  mergeDerivedLogisticsZone(o);
  return o;
}

/** Sets `logisticsZone` from country + postcode for AU/CA (server should call too). */
export function mergeDerivedLogisticsZone(rec: Record<string, string>): void {
  const iso = countryLabelToIso2(rec.country ?? "");
  if (!iso || !yanwenCountryUsesZones(iso)) {
    delete rec.logisticsZone;
    return;
  }
  const pc = (rec.postalCode ?? rec.zip ?? "").trim();
  const z = deriveYanwenLaneZoneDigit(iso, pc);
  if (z) rec.logisticsZone = z;
  else delete rec.logisticsZone;
}

/** Saved `UserAddress` row shape (or API) → checkout form; derives AU/CA lane zone from postcode. */
export type SavedAddressLike = {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
};

export function checkoutFormFromSavedAddress(
  row: SavedAddressLike | null | undefined,
  profile?: { firstName?: string | null; lastName?: string | null },
): CheckoutAddressForm | null {
  if (!row) return null;
  const line1 = row.line1.trim();
  const city = row.city.trim();
  const postal = row.postalCode.trim();
  const country = row.country.trim();
  if (!line1 || !city || !postal || !country) return null;
  const rec: Record<string, string> = {
    line1,
    line2: (row.line2 ?? "").trim(),
    city,
    state: (row.state ?? "").trim(),
    postalCode: postal,
    country,
    phone: (row.phone ?? "").trim(),
  };
  mergeDerivedLogisticsZone(rec);
  const base = emptyCheckoutAddress();
  return {
    ...base,
    firstName: (profile?.firstName ?? "").trim(),
    lastName: (profile?.lastName ?? "").trim(),
    line1: rec.line1,
    line2: rec.line2,
    city: rec.city,
    state: rec.state,
    postalCode: rec.postalCode,
    country: rec.country,
    phone: rec.phone,
    logisticsZone: rec.logisticsZone ?? "",
  };
}

/** Same street/city/postal/country (ignore name/phone) — compare saved billing vs shipping. */
export function checkoutAddressPhysicalEqual(
  a: CheckoutAddressForm,
  b: CheckoutAddressForm,
): boolean {
  return (
    a.line1.trim() === b.line1.trim() &&
    a.line2.trim() === b.line2.trim() &&
    a.city.trim() === b.city.trim() &&
    a.state.trim() === b.state.trim() &&
    a.postalCode.trim() === b.postalCode.trim() &&
    a.country.trim() === b.country.trim()
  );
}

/** All address fields required except company and line2 (WooCommerce-style). */
export function isCheckoutAddressComplete(a: CheckoutAddressForm): boolean {
  const iso = countryLabelToIso2(a.country);
  const postalRequired = Boolean(
    iso && isPostalRequiredForCheckout(iso, a.state),
  );
  const cityRequired = isCityRequiredForCountry(a.country);
  const stateRequired = isStateRequiredForCountry(a.country);
  return (
    a.firstName.trim().length > 0 &&
    a.lastName.trim().length > 0 &&
    a.line1.trim().length > 0 &&
    (cityRequired ? a.city.trim().length > 0 : true) &&
    (stateRequired ? a.state.trim().length > 0 : true) &&
    (postalRequired ? a.postalCode.trim().length > 0 : true) &&
    a.country.trim().length > 0 &&
    a.phone.trim().length > 0
  );
}

export function isAddressRecordComplete(
  r: Record<string, string> | null | undefined,
): boolean {
  if (!r) return false;
  const country = (r.country || "").trim();
  const state = (r.state || "").trim();
  const iso = countryLabelToIso2(country);
  const postalRequired = Boolean(iso && isPostalRequiredForCheckout(iso, state));
  const cityRequired = isCityRequiredForCountry(country);
  const stateRequired = isStateRequiredForCountry(country);
  const postal = (r.postalCode || r.zip || "").trim();
  const name =
    (r.fullName || "").trim() ||
    [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
  return (
    name.length > 0 &&
    (r.line1 || "").trim().length > 0 &&
    (cityRequired ? (r.city || "").trim().length > 0 : true) &&
    (stateRequired ? (r.state || "").trim().length > 0 : true) &&
    (postalRequired ? postal.length > 0 : true) &&
    (r.country || "").trim().length > 0 &&
    (r.phone || "").trim().length > 0
  );
}
