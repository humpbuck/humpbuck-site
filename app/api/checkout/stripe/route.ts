import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateCartLines } from "@/lib/order-lines";
import type { CartLine } from "@/lib/cart-types";
import { sanitizeTrafficSource } from "@/lib/attribution-server";
import {
  isCheckoutCountryChina,
  isShippingMethodId,
  quoteCheckoutShipping,
} from "@/lib/checkout-shipping-quote";
import { getDestinationCoverage } from "@/lib/logistics-estimate";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { resolveOrderAddressJson } from "@/lib/resolve-order-addresses";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

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

  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);
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

  const shippingCents = shipQ.shippingUsdCents;
  const orderTotalCents = totalCents + shippingCents;

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

  const notes = String(body.orderNotes ?? "").trim();
  const order = await prisma.order.create({
    data: {
      userId: sessionUser?.user?.id,
      email,
      status: "pending_payment",
      provider: "stripe",
      providerRef: null,
      totalCents: orderTotalCents,
      itemsJson,
      billingJson: resolved.billingJson,
      shippingJson: shippingJsonOut,
      orderNotes: notes || null,
      trafficSource,
    },
  });

  const productLineItems = lines.map((line) => ({
    quantity: line.qty,
    price_data: {
      currency: "usd",
      unit_amount: line.unitAmountCents,
      product_data: {
        name: line.variantLabel
          ? `${line.name} — ${line.variantLabel}`
          : line.name,
      },
    },
  }));

  const lineItems =
    shippingCents > 0
      ? [
          ...productLineItems,
          {
            quantity: 1,
            price_data: {
              currency: "usd" as const,
              unit_amount: shippingCents,
              product_data: {
                name: shipQ.lineLabel,
              },
            },
          },
        ]
      : productLineItems;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: order.id,
    line_items: lineItems,
    success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/cart`,
    metadata: {
      orderId: order.id,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { providerRef: checkoutSession.id },
  });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
