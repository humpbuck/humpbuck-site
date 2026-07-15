import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkoutFormFromSavedAddress,
  validateCheckoutAddressForm,
  type CheckoutAddressValidationErrorKey,
} from "@/lib/checkout-address";
import {
  CHECKOUT_ORDER_ERROR_CODES,
  type CheckoutOrderAddressScope,
} from "@/lib/checkout-order-errors";
import { notifyAdminInboxOrderPlaced } from "@/lib/admin-inbox";
import { notifyMerchantOrderPlaced } from "@/lib/merchant-order-email";
import { prisma } from "@/lib/prisma";
import {
  computeCheckoutTotalCents,
  quoteCheckoutShippingMethod,
} from "@/lib/shipping-fee-rates";
import { isShippingMethodId } from "@/lib/shipping-express-methods";

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

function addressRecordFromPayload(
  record: Record<string, string | number | null> | undefined,
): Record<string, string> | undefined {
  if (!record) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function validateCheckoutAddressRecord(
  record: Record<string, string> | undefined,
  addressScope: CheckoutOrderAddressScope,
): CheckoutAddressValidationErrorKey | null {
  if (!record) return null;
  const form = checkoutFormFromSavedAddress(record);
  if (!form) return null;
  const result = validateCheckoutAddressForm(form);
  if (result.ok) return null;
  return result.errorKey;
}

export async function POST(req: Request) {
  let body: {
    email?: string;
    totalUsd?: number;
    items?: CheckoutItem[];
    billing?: Record<string, string>;
    shipping?: Record<string, string | number | null>;
    shippingFeeCents?: number;
    surchargeCents?: number;
    shippingMethodId?: string;
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
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_ORDER_ERROR_CODES.INVALID_JSON },
      { status: 400 },
    );
  }

  if (
    !body.email ||
    typeof body.totalUsd !== "number" ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_ORDER_ERROR_CODES.MISSING_FIELDS },
      { status: 400 },
    );
  }

  const shippingValidationKey = validateCheckoutAddressRecord(
    addressRecordFromPayload(body.shipping),
    "shipping",
  );
  if (shippingValidationKey) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: CHECKOUT_ORDER_ERROR_CODES.ADDRESS_INVALID,
        addressScope: "shipping",
        validationKey: shippingValidationKey,
      },
      { status: 400 },
    );
  }

  const billingValidationKey = validateCheckoutAddressRecord(body.billing, "billing");
  if (billingValidationKey) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: CHECKOUT_ORDER_ERROR_CODES.ADDRESS_INVALID,
        addressScope: "billing",
        validationKey: billingValidationKey,
      },
      { status: 400 },
    );
  }

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

  const linesSubtotalCents = normalizedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const discountCents = Math.max(0, Math.round(body.discountCents ?? 0));
  const countryLabel = pickString(body.shipping?.country) ?? "";
  const postalCode = pickString(body.shipping?.postalCode, body.shipping?.zip) ?? "";
  const shippingMethodIdRaw =
    pickString(body.shippingMethodId, body.shippingMethod, body.shipping?.shippingMethodId as string) ??
    "standard";
  if (!isShippingMethodId(shippingMethodIdRaw)) {
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_ORDER_ERROR_CODES.MISSING_FIELDS, error: "Invalid shipping method." },
      { status: 400 },
    );
  }

  const shippingQuoteResult = await quoteCheckoutShippingMethod(
    shippingMethodIdRaw,
    countryLabel,
    postalCode,
  );
  if (!shippingQuoteResult.ok) {
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_ORDER_ERROR_CODES.MISSING_FIELDS, error: "Shipping is not available for this country." },
      { status: 400 },
    );
  }
  const shippingQuote = shippingQuoteResult;

  const clientShippingFeeCents = Math.max(0, Math.round(body.shippingFeeCents ?? 0));
  const clientSurchargeCents = Math.max(0, Math.round(body.surchargeCents ?? 0));
  if (
    clientShippingFeeCents !== shippingQuote.shippingFeeUsdCents ||
    clientSurchargeCents !== shippingQuote.surchargeUsdCents
  ) {
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_ORDER_ERROR_CODES.MISSING_FIELDS, error: "Shipping fee changed. Refresh checkout and try again." },
      { status: 400 },
    );
  }

  const expectedTotalCents = computeCheckoutTotalCents({
    subtotalCents: linesSubtotalCents,
    shippingFeeUsdCents: shippingQuote.shippingFeeUsdCents,
    surchargeUsdCents: shippingQuote.surchargeUsdCents,
    discountCents,
  });
  const totalCents = Math.max(0, Math.round(body.totalUsd * 100));
  if (totalCents !== expectedTotalCents) {
    return NextResponse.json(
      { ok: false, errorCode: CHECKOUT_ORDER_ERROR_CODES.MISSING_FIELDS, error: "Order total does not match configured shipping fee." },
      { status: 400 },
    );
  }

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  const shippingJson = body.shipping
    ? JSON.stringify({
        ...body.shipping,
        shippingFeeCnyCents: shippingQuote.shippingFeeCnyCents,
        surchargeCnyCents: shippingQuote.surchargeCnyCents,
        shippingTotalCnyCents: shippingQuote.shippingFeeCnyCents + shippingQuote.surchargeCnyCents,
        shippingFeeUsdCents: shippingQuote.shippingFeeUsdCents,
        surchargeUsdCents: shippingQuote.surchargeUsdCents,
        shippingTotalUsdCents: shippingQuote.totalUsdCents,
        cnyPerUsd: shippingQuote.cnyPerUsd,
        shippingRateKey: shippingQuote.rateKey ?? null,
        shippingCountryCode: countryLabel,
        postalZone: shippingQuote.postalZone ?? null,
        shippingMethodId: shippingMethodIdRaw,
        shippingMethodLabel: shippingQuote.label,
        deliveryDaysLabel: shippingQuote.deliveryDaysLabel,
      })
    : null;

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
        shippingJson,
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
    await notifyAdminInboxOrderPlaced(order.id);

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `Failed to create order: ${message}` },
      { status: 500 },
    );
  }
}
