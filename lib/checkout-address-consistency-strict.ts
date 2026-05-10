import type { CheckoutAddressRecord } from "@/lib/checkout-address";

export function validateAddressRecordConsistencyStrict(
  record: CheckoutAddressRecord,
): { ok: true } | { ok: false; error: string } {
  if (!record.firstName?.trim()) return { ok: false, error: "First name is required" };
  if (!record.lastName?.trim()) return { ok: false, error: "Last name is required" };
  if (!record.line1?.trim()) return { ok: false, error: "Street address is required" };
  if (!record.city?.trim()) return { ok: false, error: "City is required" };
  if (!record.state?.trim()) return { ok: false, error: "State / Province is required" };
  if (!record.postalCode?.trim() && !record.zip?.trim()) return { ok: false, error: "Postcode / ZIP is required" };
  if (!record.country?.trim()) return { ok: false, error: "Country / Region is required" };
  return { ok: true };
}
