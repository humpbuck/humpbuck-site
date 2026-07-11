import { NextResponse } from "next/server";
import { createStripePaymentIntent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: {
    totalUsd?: number;
    orderId?: string;
    customerEmail?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.totalUsd !== "number" || body.totalUsd <= 0) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const totalCents = Math.max(50, Math.round(body.totalUsd * 100));

  if (body.orderId) {
    const order = await prisma.order.findUnique({ where: { id: body.orderId } });
    if (!order || order.deletedAt || order.status !== "pending_payment") {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    if (order.totalCents !== totalCents) {
      await prisma.order.update({
        where: { id: order.id },
        data: { totalCents },
      });
    }
  }

  try {
    const intent = await createStripePaymentIntent({
      totalUsd: totalCents / 100,
      orderId: body.orderId ?? "preview",
      customerEmail: body.customerEmail,
    });

    if (body.orderId) {
      await prisma.order.updateMany({
        where: { id: body.orderId, status: "pending_payment" },
        data: {
          provider: "stripe",
          providerRef: intent.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Stripe not configured" ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
