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
