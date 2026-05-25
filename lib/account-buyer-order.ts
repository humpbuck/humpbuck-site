/** Buyer-facing account order list + detail (not admin). */

import {
  countryLabelToIso2,
  expandStateFullName,
  formatPhoneInternational,
} from "@/lib/admin/order-ui";
import { getTaxIdRule, taxIdFieldLabel } from "@/lib/tax-id-rules";

export type BuyerAddressFieldRow = {
  label: string;
  value: string;
  href?: string;
};

export type BuyerAddressFieldLabels = {
  name: string;
  company: string;
  streetAddress: string;
  city: string;
  stateFullName: string;
  zip: string;
  country: string;
  phoneNumber: string;
  email: string;
};

const DEFAULT_BUYER_ADDRESS_FIELD_LABELS: BuyerAddressFieldLabels = {
  name: "Name",
  company: "Company",
  streetAddress: "Street address",
  city: "City",
  stateFullName: "State (full name)",
  zip: "ZIP code",
  country: "Country",
  phoneNumber: "Phone number",
  email: "Email",
};

/**
 * Field / content rows for shipping or billing (matches admin-style breakdown).
 */
export function buyerOrderAddressFieldRows(
  rec: Record<string, string> | null,
  orderEmail: string,
  labels: BuyerAddressFieldLabels = DEFAULT_BUYER_ADDRESS_FIELD_LABELS,
): BuyerAddressFieldRow[] {
  if (!rec || Object.keys(rec).length === 0) return [];

  const name =
    rec.fullName ||
    [rec.firstName, rec.lastName].filter(Boolean).join(" ").trim() ||
    rec.name?.trim() ||
    "";
  const company = rec.company?.trim() ?? "";
  const line1 = rec.line1?.trim() ?? "";
  const line2 = rec.line2?.trim() ?? "";
  const street = [line1, line2].filter(Boolean).join(", ");
  const city = rec.city?.trim() ?? "";
  const stateRaw = rec.state?.trim() ?? "";
  const stateFull =
    stateRaw.length > 0 ? expandStateFullName(stateRaw) : "—";
  const zip = (rec.postalCode || rec.zip || "").trim() || "—";
  const country = rec.country?.trim() || "—";
  const taxIdRaw = rec.taxId?.trim() ?? "";
  const countryIso2 = countryLabelToIso2(country !== "—" ? country : "");
  const showTaxId = Boolean(taxIdRaw) || getTaxIdRule(countryIso2).required;

  const phoneFmt = formatPhoneInternational(rec.phone, rec.country);
  const email = orderEmail.trim();

  const rows: BuyerAddressFieldRow[] = [
    { label: labels.name, value: name || "—" },
    { label: labels.company, value: company || "—" },
    { label: labels.streetAddress, value: street || "—" },
    { label: labels.city, value: city || "—" },
    { label: labels.stateFullName, value: stateFull },
    { label: labels.zip, value: zip },
    { label: labels.country, value: country },
  ];

  if (showTaxId) {
    rows.push({
      label: taxIdFieldLabel(countryIso2),
      value: taxIdRaw || "—",
    });
  }

  if (phoneFmt) {
    rows.push({
      label: labels.phoneNumber,
      value: phoneFmt.display,
      href: phoneFmt.telHref,
    });
  } else {
    rows.push({ label: labels.phoneNumber, value: "—" });
  }

  rows.push({
    label: labels.email,
    value: email || "—",
    href: email ? `mailto:${email}` : undefined,
  });

  return rows;
}

export function buyerOrderStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "processing":
      return "Processing";
    case "pending_payment":
      return "Pending payment";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

const BUYER_ORDER_STATUS_I18N_KEYS = new Set([
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

/** Buyer-facing status label using next-intl `OrderStatus` messages when available. */
export function buyerOrderStatusForLocale(
  status: string,
  t: (key: string) => string,
): string {
  if (BUYER_ORDER_STATUS_I18N_KEYS.has(status)) return t(status);
  return status;
}

export function canBuyerEditShipping(order: {
  status: string;
  trackingNumber: string | null;
}): boolean {
  return (
    (order.status === "paid" || order.status === "processing") &&
    !order.trackingNumber?.trim()
  );
}

/** Buyer cannot cancel once the order is marked shipped (status only). */
export type BuyerCancelBlockReason = "shipped" | "not_eligible";

export function buyerCancelBlockedReason(order: {
  status: string;
  trackingNumber?: string | null;
}): BuyerCancelBlockReason | null {
  const { status } = order;
  if (status === "cancelled" || status === "refunded") {
    return "not_eligible";
  }
  if (status === "shipped") {
    return "shipped";
  }
  if (status === "delivered") {
    return "not_eligible";
  }
  if (
    status === "pending_payment" ||
    status === "paid" ||
    status === "processing"
  ) {
    return null;
  }
  return "not_eligible";
}

export function canBuyerCancelOrder(order: {
  status: string;
  trackingNumber?: string | null;
}): boolean {
  return buyerCancelBlockedReason(order) === null;
}

/** Refund / original-payment copy only applies after a captured payment. */
export function buyerCancelShowsRefundNotice(order: { status: string }): boolean {
  return order.status === "paid" || order.status === "processing";
}

/** Show “Cancel order” for unpaid (pending), paid, or processing (not shipped / terminal). */
export function showBuyerCancelOrderCta(order: { status: string }): boolean {
  if (
    order.status === "cancelled" ||
    order.status === "refunded" ||
    order.status === "shipped"
  ) {
    return false;
  }
  return (
    order.status === "pending_payment" ||
    order.status === "paid" ||
    order.status === "processing"
  );
}
