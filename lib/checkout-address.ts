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
