import type { UserAddress } from "@prisma/client";
import {
  checkoutFormFromSavedAddress,
  type CheckoutAddressForm,
  type CheckoutAddressRecord,
} from "@/lib/checkout-address";
import { prisma } from "@/lib/prisma";

export type CheckoutAccountPrefill = {
  shipping: CheckoutAddressForm | null;
  billing: CheckoutAddressForm | null;
  billSameAsShipping: boolean;
};

const PAID_ORDER_STATUSES = ["paid", "processing", "shipped"] as const;

function parseOrderAddressJson(json: string | null | undefined): CheckoutAddressRecord | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as CheckoutAddressRecord;
  } catch {
    return null;
  }
}

function userAddressRowToRecord(
  row: UserAddress,
  names: { firstName?: string | null; lastName?: string | null },
): CheckoutAddressRecord {
  return {
    firstName: names.firstName ?? "",
    lastName: names.lastName ?? "",
    line1: row.line1,
    line2: row.line2 ?? "",
    city: row.city,
    state: row.state ?? "",
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone ?? "",
  };
}

function withProfileNames(
  form: CheckoutAddressForm | null,
  names: { firstName?: string | null; lastName?: string | null },
): CheckoutAddressForm | null {
  if (!form) return null;
  return {
    ...form,
    firstName: form.firstName.trim() || names.firstName?.trim() || "",
    lastName: form.lastName.trim() || names.lastName?.trim() || "",
  };
}

function isUsableCheckoutForm(form: CheckoutAddressForm | null): form is CheckoutAddressForm {
  return Boolean(form?.line1?.trim() && form.city.trim() && form.postalCode.trim() && form.country.trim());
}

function formsEquivalent(a: CheckoutAddressForm, b: CheckoutAddressForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Saved `UserAddress` rows first; falls back to the buyer's most recent paid order.
 */
export async function loadCheckoutAccountPrefill(userId: string): Promise<CheckoutAccountPrefill> {
  const [rows, profile, lastOrder] = await Promise.all([
    prisma.userAddress.findMany({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    }),
    prisma.order.findFirst({
      where: {
        userId,
        deletedAt: null,
        status: { in: [...PAID_ORDER_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
      select: { billingJson: true, shippingJson: true },
    }),
  ]);

  const profileNames = {
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
  };

  const shippingRow = rows.find((r) => r.type === "shipping") ?? null;
  const billingRow = rows.find((r) => r.type === "billing") ?? null;

  let shipping =
    shippingRow != null
      ? withProfileNames(
          checkoutFormFromSavedAddress(userAddressRowToRecord(shippingRow, profileNames)),
          profileNames,
        )
      : null;

  if (!isUsableCheckoutForm(shipping) && lastOrder) {
    shipping = withProfileNames(
      checkoutFormFromSavedAddress(parseOrderAddressJson(lastOrder.shippingJson)),
      profileNames,
    );
  }

  let billing =
    billingRow != null
      ? withProfileNames(
          checkoutFormFromSavedAddress(userAddressRowToRecord(billingRow, profileNames)),
          profileNames,
        )
      : null;

  if (!isUsableCheckoutForm(billing) && lastOrder) {
    billing = withProfileNames(
      checkoutFormFromSavedAddress(parseOrderAddressJson(lastOrder.billingJson)),
      profileNames,
    );
  }

  if (!isUsableCheckoutForm(billing) && isUsableCheckoutForm(shipping)) {
    billing = shipping;
  }

  const billSameAsShipping =
    isUsableCheckoutForm(shipping) &&
    isUsableCheckoutForm(billing) &&
    formsEquivalent(shipping, billing);

  return {
    shipping: isUsableCheckoutForm(shipping) ? shipping : null,
    billing: isUsableCheckoutForm(billing) ? billing : null,
    billSameAsShipping,
  };
}
