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

export function validateCheckoutAddressForm(form: CheckoutAddressForm): { ok: true } | { ok: false; error: string } {
  if (!form.firstName.trim()) return { ok: false, error: "First name is required" };
  if (!form.lastName.trim()) return { ok: false, error: "Last name is required" };
  if (!form.line1.trim()) return { ok: false, error: "Street address is required" };
  if (!form.city.trim()) return { ok: false, error: "City is required" };
  if (!form.state.trim()) return { ok: false, error: "State / Province is required" };
  if (!form.postalCode.trim()) return { ok: false, error: "Postcode / ZIP is required" };
  if (!form.country.trim()) return { ok: false, error: "Country / Region is required" };
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
