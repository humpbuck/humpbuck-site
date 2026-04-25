import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateCartLines } from "@/lib/order-lines";
import type { CartLine } from "@/lib/cart-types";
import { sanitizeTrafficSource } from "@/lib/attribution-server";
import { paypalCreateOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import {
  isCheckoutCountryChina,
  isShippingMethodId,
  quoteCheckoutShipping,
} from "@/lib/checkout-shipping-quote";
import { getDestinationCoverage } from "@/lib/logistics-estimate";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { resolveOrderAddressJson } from "@/lib/resolve-order-addresses";
import { checkInventory } from "@/lib/inventory";

/** Max total units per single checkout (supports manual make-up orders). */
const MAX_CHECKOUT_UNITS = 5000;

export async function POST(req: Request) {
  let body: {
    items?: CartLine[];
    email?: string;
    billing?: Record<string, string>;
    shipping?: Record<string, string>;
    orderNotes?: string;
    trafficSource?: string;
    shippingMethod?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "PayPal is not configured" },
      { status: 503 },
    );
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  let lines;
  let totalCents: number;
  try {
    const v = validateCartLines(items);
    lines = v.lines;
    totalCents = v.totalCents;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid cart" },
      { status: 400 },
    );
  }

  // Cart quantity limit
  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);
  if (totalUnits > MAX_CHECKOUT_UNITS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_CHECKOUT_UNITS} items per order.` },
      { status: 400 },
    );
  }

  // Inventory check (pre-payment)
  const stock = await checkInventory(lines);
  if (!stock.ok) {
    const names = stock.unavailable
      .map((u) => `${u.slug}${u.variantId ? ` (${u.variantId})` : ""}: only ${u.available} left`)
      .join("; ");
    return NextResponse.json(
      { error: `Insufficient stock: ${names}` },
      { status: 400 },
    );
  }

  const sessionUser = await auth();
  const email =
    String(body.email || "").trim() ||
    sessionUser?.user?.email ||
    undefined;
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const itemsJson = JSON.stringify(lines);
  const trafficSource = sanitizeTrafficSource(body.trafficSource);

  const resolved = await resolveOrderAddressJson({
    billing: body.billing,
    shipping: body.shipping,
  });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const methodRaw = String(body.shippingMethod ?? "cainiao");
  if (!isShippingMethodId(methodRaw)) {
    return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
  }

  const shipRec = (() => {
    try {
      return resolved.shippingJson
        ? (JSON.parse(resolved.shippingJson) as Record<string, string>)
        : null;
    } catch {
      return null;
    }
  })();
  const shipCountry = String(shipRec?.country ?? "").trim();
  const shipPostal = String(shipRec?.postalCode ?? shipRec?.zip ?? "").trim();
  const shipState = String(shipRec?.state ?? "").trim() || null;

  if (!isCheckoutCountryChina(shipCountry)) {
    const cov = getDestinationCoverage(shipCountry, { state: shipState });
    if (!cov.cainiao && !cov.yanwen) {
      return NextResponse.json(
        {
          error: `This address is not available for online checkout. For other shipping options, contact us on WhatsApp: ${WHATSAPP_DISPLAY}.`,
        },
        { status: 400 },
      );
    }
  }

  const shipQ = quoteCheckoutShipping({
    countryLabel: shipCountry,
    totalUnits,
    method: methodRaw,
    state: shipState,
    postalCode: shipPostal,
    yanwenLogisticsZone: String(shipRec?.logisticsZone ?? "").trim() || null,
  });
  if (!shipQ.ok) {
    return NextResponse.json({ error: shipQ.error }, { status: 400 });
  }

  const orderTotalCents = totalCents + shipQ.shippingUsdCents;

  let shippingJsonOut = resolved.shippingJson;
  if (shippingJsonOut) {
    try {
      const o = JSON.parse(shippingJsonOut) as Record<string, string>;
      o.shippingMethod = methodRaw;
      o.shippingEstimateCny = String(shipQ.shippingCny);
      shippingJsonOut = JSON.stringify(o);
    } catch {
      /* keep original */
    }
  }

  const totalUsd = (orderTotalCents / 100).toFixed(2);

  const { id: paypalOrderId, approvalUrl } = await paypalCreateOrder(
    totalUsd,
    `${base}/api/checkout/paypal/return`,
    `${base}/cart`,
  );

  const notes = String(body.orderNotes ?? "").trim();
  await prisma.order.create({
    data: {
      userId: sessionUser?.user?.id,
      email,
      status: "pending_payment",
      provider: "paypal",
      providerRef: paypalOrderId,
      totalCents: orderTotalCents,
      itemsJson,
      billingJson: resolved.billingJson,
      shippingJson: shippingJsonOut,
      orderNotes: notes || null,
      trafficSource,
    },
  });

  return NextResponse.json({ url: approvalUrl });
}
