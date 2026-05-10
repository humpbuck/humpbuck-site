import type { CheckoutAddressForm } from "@/lib/checkout-address";

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
