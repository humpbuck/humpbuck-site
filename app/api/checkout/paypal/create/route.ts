import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateCartLines } from "@/lib/order-lines";
import type { CartLine } from "@/lib/cart-types";
import { sanitizeTrafficSource } from "@/lib/attribution-server";
import { paypalCreateOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

  const totalUsd = (totalCents / 100).toFixed(2);
  const itemsJson = JSON.stringify(lines);
  const shippingJson = body.shipping
    ? JSON.stringify(body.shipping)
    : undefined;
  const trafficSource = sanitizeTrafficSource(body.trafficSource);

  const { id: paypalOrderId, approvalUrl } = await paypalCreateOrder(
    totalUsd,
    `${base}/api/checkout/paypal/return`,
    `${base}/cart`,
  );

  await prisma.order.create({
    data: {
      userId: sessionUser?.user?.id,
      email,
      status: "pending_payment",
      provider: "paypal",
      providerRef: paypalOrderId,
      totalCents,
      itemsJson,
      shippingJson,
      trafficSource,
    },
  });

  return NextResponse.json({ url: approvalUrl });
}
