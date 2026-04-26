/** Buyer-facing account order list + detail (not admin). */

import {
  expandStateFullName,
  formatPhoneInternational,
} from "@/lib/admin/order-ui";

export type BuyerAddressFieldRow = {
  label: string;
  value: string;
  href?: string;
};

/**
 * Field / content rows for shipping or billing (matches admin-style breakdown).
 */
export function buyerOrderAddressFieldRows(
  rec: Record<string, string> | null,
  orderEmail: string,
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

  const phoneFmt = formatPhoneInternational(rec.phone, rec.country);
  const email = orderEmail.trim();

  const rows: BuyerAddressFieldRow[] = [
    { label: "Name", value: name || "—" },
    { label: "Company", value: company || "—" },
    { label: "Street address", value: street || "—" },
    { label: "City", value: city || "—" },
    { label: "State (full name)", value: stateFull },
    { label: "ZIP code", value: zip },
    { label: "Country", value: country },
  ];

  if (phoneFmt) {
    rows.push({
      label: "Phone number",
      value: phoneFmt.display,
      href: phoneFmt.telHref,
    });
  } else {
    rows.push({ label: "Phone number", value: "—" });
  }

  rows.push({
    label: "Email",
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
