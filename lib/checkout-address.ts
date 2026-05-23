import {
  validateCheckoutPostalCode,
  type CheckoutPostalValidationErrorKey,
} from "@/lib/checkout-postal-validation";

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
  logisticsZone: string;
  phone: string;
  taxId: string;
};

export type CheckoutAddressRecord = Record<string, string>;

export type CheckoutAddressValidationErrorKey =
  | "firstNameRequired"
  | "lastNameRequired"
  | "streetRequired"
  | "cityRequired"
  | "stateRequired"
  | "postalRequired"
  | "countryRequired"
  | CheckoutPostalValidationErrorKey;

const CHECKOUT_ADDRESS_VALIDATION_EN: Record<
  CheckoutAddressValidationErrorKey,
  string
> = {
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  streetRequired: "Street address is required",
  cityRequired: "City is required",
  stateRequired: "State / Province is required",
  postalRequired: "Postcode / ZIP is required",
  countryRequired: "Country / Region is required",
  postalInvalidFormat: "Enter a valid postcode / ZIP for the selected country",
  postalNotFound: "This postcode / ZIP was not found — check for typos",
  postalStateMismatch: "This postcode / ZIP does not match the selected state / province",
};

/** English message for API / server logs (storefront UI should use next-intl keys under `CheckoutAddress.validation`). */
export function formatCheckoutAddressValidationEnglish(
  key: CheckoutAddressValidationErrorKey,
): string {
  return CHECKOUT_ADDRESS_VALIDATION_EN[key];
}

export function isAddressRecordComplete(record: CheckoutAddressRecord): boolean {
  return Boolean(
    record.firstName?.trim() &&
      record.lastName?.trim() &&
      record.line1?.trim() &&
      record.city?.trim() &&
      record.state?.trim() &&
      record.postalCode?.trim() &&
      record.country?.trim(),
  );
}

export function mergeDerivedLogisticsZone(record: CheckoutAddressRecord): CheckoutAddressRecord {
  return record;
}

export function checkoutFormFromOrderRecord(address: CheckoutAddressRecord | null | undefined): CheckoutAddressForm | null {
  return checkoutFormFromSavedAddress(address);
}

export function validateCheckoutAddressForm(
  form: CheckoutAddressForm,
):
  | { ok: true }
  | { ok: false; errorKey: CheckoutAddressValidationErrorKey } {
  if (!form.firstName.trim()) return { ok: false, errorKey: "firstNameRequired" };
  if (!form.lastName.trim()) return { ok: false, errorKey: "lastNameRequired" };
  if (!form.line1.trim()) return { ok: false, errorKey: "streetRequired" };
  if (!form.city.trim()) return { ok: false, errorKey: "cityRequired" };
  if (!form.state.trim()) return { ok: false, errorKey: "stateRequired" };
  if (!form.postalCode.trim()) return { ok: false, errorKey: "postalRequired" };
  if (!form.country.trim()) return { ok: false, errorKey: "countryRequired" };

  const postal = validateCheckoutPostalCode(form);
  if (!postal.ok) return postal;

  return { ok: true };
}

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
    country: "United States (US)",
    logisticsZone: "",
    phone: "",
    taxId: "",
  };
}

export function addressFormToRecord(form: CheckoutAddressForm): CheckoutAddressRecord {
  return { ...form };
}

export function isCheckoutAddressComplete(form: CheckoutAddressForm): boolean {
  return Boolean(
    form.firstName.trim() &&
      form.lastName.trim() &&
      form.line1.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.postalCode.trim() &&
      form.country.trim(),
  );
}

export function checkoutFormFromSavedAddress(
  address: CheckoutAddressRecord | null | undefined,
): CheckoutAddressForm | null {
  if (!address) return null;
  return {
    firstName: address.firstName ?? "",
    lastName: address.lastName ?? "",
    company: address.company ?? "",
    line1: address.line1 ?? "",
    line2: address.line2 ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postalCode: address.postalCode ?? address.zip ?? "",
    country: address.country ?? "United States (US)",
    logisticsZone: address.logisticsZone ?? "",
    phone: address.phone ?? "",
    taxId: address.taxId ?? "",
  };
}
