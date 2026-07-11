import type { CheckoutAddressForm } from "@/lib/checkout-address";
import { emptyCheckoutAddress } from "@/lib/checkout-address";
import { normalizeUsStateCode } from "@/lib/us-state-codes";
import { State } from "country-state-city";

type PayPalPersonName = {
  given_name?: string;
  surname?: string;
  full_name?: string;
};

type PayPalAddress = {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_1?: string;
  admin_area_2?: string;
  postal_code?: string;
  country_code?: string;
};

type PayPalOrderShippingPayload = {
  payer?: {
    email_address?: string;
    name?: PayPalPersonName;
    phone?: { phone_number?: { national_number?: string } };
    address?: PayPalAddress;
  };
  purchase_units?: Array<{
    shipping?: {
      name?: PayPalPersonName;
      address?: PayPalAddress;
    };
  }>;
};

function countryLabel(iso2: string): string {
  const name = new Intl.DisplayNames(["en"], { type: "region" }).of(iso2) ?? iso2;
  return `${name} (${iso2})`;
}

function normalizeUsZip(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function normalizeCanadianPostal(postalCode: string): string {
  return postalCode.replace(/\s+/g, " ").trim().toUpperCase();
}

function formatStateLabel(adminArea1: string, countryIso2: string): string {
  const trimmed = adminArea1.trim();
  if (!trimmed) return "";

  if (countryIso2 === "US") {
    const code = normalizeUsStateCode(trimmed) ?? trimmed.toUpperCase();
    const stateName =
      State.getStateByCodeAndCountry(code, "US")?.name ??
      State.getStatesOfCountry("US").find(
        (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
      )?.name ??
      trimmed;
    return `${stateName} (${code})`;
  }

  const matched = State.getStatesOfCountry(countryIso2).find(
    (item) =>
      item.isoCode.toLowerCase() === trimmed.toLowerCase() ||
      item.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (matched) return `${matched.name} (${matched.isoCode})`;
  return trimmed;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function personName(name?: PayPalPersonName): { firstName: string; lastName: string } {
  const first = name?.given_name?.trim() ?? "";
  const last = name?.surname?.trim() ?? "";
  if (first || last) return { firstName: first, lastName: last };
  return splitFullName(name?.full_name ?? "");
}

function phoneFromPayPal(payer?: PayPalOrderShippingPayload["payer"]): string {
  const national = payer?.phone?.phone_number?.national_number?.replace(/\D/g, "") ?? "";
  if (!national) return "";
  const countryIso2 = payer?.address?.country_code?.trim().toUpperCase() ?? "";
  if (countryIso2 === "US" || countryIso2 === "CA") return `+1${national}`;
  return national.startsWith("+") ? national : `+${national}`;
}

function addressFromPayPal(
  address: PayPalAddress | undefined,
  name: PayPalPersonName | undefined,
  phone: string,
): CheckoutAddressForm {
  const base = emptyCheckoutAddress();
  const countryIso2 = address?.country_code?.trim().toUpperCase() ?? "US";
  const { firstName, lastName } = personName(name);
  let postalCode = address?.postal_code?.trim() ?? "";
  if (countryIso2 === "US") postalCode = normalizeUsZip(postalCode);
  if (countryIso2 === "CA") postalCode = normalizeCanadianPostal(postalCode);

  return {
    ...base,
    firstName,
    lastName,
    line1: address?.address_line_1?.trim() ?? "",
    line2: address?.address_line_2?.trim() ?? "",
    city: address?.admin_area_2?.trim() ?? "",
    state: formatStateLabel(address?.admin_area_1?.trim() ?? "", countryIso2),
    postalCode,
    country: countryIso2 ? countryLabel(countryIso2) : base.country,
    phone,
  };
}

export function normalizePayPalOrderToCheckoutPrefill(payload: PayPalOrderShippingPayload): {
  email: string;
  billing: CheckoutAddressForm;
  shipping: CheckoutAddressForm;
} | null {
  const email = payload.payer?.email_address?.trim() ?? "";
  const shippingBlock = payload.purchase_units?.[0]?.shipping;
  const shipAddress = shippingBlock?.address ?? payload.payer?.address;
  if (!shipAddress?.address_line_1?.trim() && !shipAddress?.admin_area_2?.trim()) {
    return null;
  }

  const phone = phoneFromPayPal(payload.payer);
  const shipping = addressFromPayPal(
    shipAddress,
    shippingBlock?.name ?? payload.payer?.name,
    phone,
  );
  const billing = payload.payer?.address?.address_line_1
    ? addressFromPayPal(payload.payer.address, payload.payer.name, phone)
    : shipping;

  return { email, billing, shipping };
}
