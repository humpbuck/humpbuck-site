import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkoutFormFromSavedAddress,
  formatCheckoutAddressValidationEnglish,
  validateCheckoutAddressForm,
} from "@/lib/checkout-address";
import { notifyMerchantOrderPlaced } from "@/lib/merchant-order-email";
import { prisma } from "@/lib/prisma";

type CheckoutItem = {
  slug: string;
  name?: string;
  productName?: string;
  qty: number;
  unitPrice?: number;
  price?: number;
  lineTotal?: number;
  unitAmountCents?: number;
  lineTotalCents?: number;
  variantId?: string;
  variantLabel?: string;
  variantImage?: string;
  productImage?: string;
  productSnapshot?: unknown;
};

function toCents(value?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

function pickString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function validateCheckoutAddressRecord(
  record: Record<string, string> | undefined,
  label: "Billing" | "Shipping",
): string | null {
  if (!record) return null;
  const form = checkoutFormFromSavedAddress(record);
  if (!form) return null;
  const result = validateCheckoutAddressForm(form);
  if (result.ok) return null;
  return `${label}: ${formatCheckoutAddressValidationEnglish(result.errorKey)}`;
}

export async function POST(req: Request) {
  let body: {
    email?: string;
    totalUsd?: number;
    items?: CheckoutItem[];
    billing?: Record<string, string>;
    shipping?: Record<string, string>;
    shippingMethod?: string;
    shippingEstimateCny?: number;
    couponCode?: string | null;
    discountCents?: number;
    returnUrl?: string;
    trafficSource?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.email ||
    typeof body.totalUsd !== "number" ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const addressError =
    validateCheckoutAddressRecord(body.shipping, "Shipping") ??
    validateCheckoutAddressRecord(body.billing, "Billing");
  if (addressError) {
    return NextResponse.json({ ok: false, error: addressError }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;
  const totalCents = Math.max(0, Math.round(body.totalUsd * 100));
  const discountCents = Math.max(0, Math.round(body.discountCents ?? 0));

  const normalizedItems = body.items.map((item) => {
    const qty = Math.max(1, Math.floor(pickNumber(item.qty) ?? 1));
    const unitPrice = pickNumber(item.unitPrice, item.price) ?? 0;
    const lineTotal = pickNumber(item.lineTotal) ?? unitPrice * qty;
    const unitPriceCents =
      pickNumber(item.unitAmountCents) ?? toCents(unitPrice);
    const lineTotalCents =
      pickNumber(item.lineTotalCents) ?? toCents(lineTotal);

    return {
      slug: pickString(item.slug) ?? "unknown",
      name: pickString(item.name, item.productName) ?? "Unknown product",
      qty,
      unitPrice,
      lineTotal,
      variantId: pickString(item.variantId),
      variantLabel: pickString(item.variantLabel),
      variantImage: pickString(item.variantImage),
      productImage: pickString(item.productImage, item.variantImage),
      productSnapshot: item.productSnapshot ?? null,
      unitPriceCents,
      lineTotalCents,
    };
  });

  try {
    // D1 does not support interactive `$transaction` callbacks — create order then line items.
    const order = await prisma.order.create({
      data: {
        userId,
        email: body.email!,
        status: "pending_payment",
        provider: "pending",
        totalCents,
        currency: "usd",
        billingJson: body.billing ? JSON.stringify(body.billing) : null,
        shippingJson: body.shipping ? JSON.stringify(body.shipping) : null,
        discountCents,
        trafficSource: typeof body.trafficSource === "string" ? body.trafficSource : "unknown",
        couponCode: body.couponCode ?? null,
      },
    });

    await prisma.orderItemSnapshot.createMany({
      data: normalizedItems.map((item) => ({
        orderId: order.id,
        productSlug: item.slug,
        productName: item.name,
        productImage: item.productImage,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        variantImage: item.variantImage,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        currency: "usd",
        productSnapshotJson: item.productSnapshot
          ? JSON.stringify(item.productSnapshot)
          : null,
      })),
    });

    await notifyMerchantOrderPlaced(order.id);

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `Failed to create order: ${message}` },
      { status: 500 },
    );
  }
}
