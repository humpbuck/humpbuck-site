"use client";

import { CheckoutAddressForm } from "@/components/checkout/checkout-address-form";
import type { CheckoutAddressForm as CheckoutAddressFormValue } from "@/lib/checkout-address";

export function CheckoutAddressFields({
  title,
  value,
  onChange,
  idPrefix,
}: {
  title: string;
  value: CheckoutAddressFormValue;
  onChange: (next: CheckoutAddressFormValue) => void;
  idPrefix: string;
}) {
  return <CheckoutAddressForm title={title} value={value} onChange={onChange} idPrefix={idPrefix} />;
}
