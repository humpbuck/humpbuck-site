import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateCartLines } from "@/lib/order-lines";
import type { CartLine } from "@/lib/cart-types";
import { sanitizeTrafficSource } from "@/lib/attribution-server";
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
    shipping?: Record<string, string>;
    trafficSource?: string;
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
  const shippingJson = body.shipping
    ? JSON.stringify(body.shipping)
    : undefined;
  const trafficSource = sanitizeTrafficSource(body.trafficSource);

  const order = await prisma.order.create({
    data: {
      userId: sessionUser?.user?.id,
      email,
      status: "pending_payment",
      provider: "stripe",
      providerRef: null,
      totalCents,
      itemsJson,
      shippingJson,
      trafficSource,
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: order.id,
    line_items: lines.map((line) => ({
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
    })),
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
