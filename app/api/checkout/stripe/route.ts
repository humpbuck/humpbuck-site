import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: {
    totalUsd?: number;
    returnUrl?: string;
    cancelUrl?: string;
    orderId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.returnUrl || !body.cancelUrl || typeof body.totalUsd !== "number" || !body.orderId) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe not configured" }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "HUMPBUCK Order" },
          unit_amount: Math.round(body.totalUsd * 100),
        },
        quantity: 1,
      },
    ],
    success_url: body.returnUrl,
    cancel_url: body.cancelUrl,
    client_reference_id: body.orderId,
    metadata: { orderId: body.orderId },
  });

  await prisma.order.updateMany({
    where: { id: body.orderId, status: "pending_payment" },
    data: {
      provider: "stripe",
      providerRef: session.id,
    },
  });

  // Keep the order linked to Stripe so the webhook can mark it paid
  // and trigger the existing merchant notification email.

  return NextResponse.json({ ok: true, url: session.url, id: session.id });
}
