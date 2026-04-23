import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { syncOrderAddressesToUserAccount } from "@/lib/sync-order-addresses-to-user";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      client_reference_id?: string | null;
      metadata?: { orderId?: string };
    };
    const orderId =
      session.client_reference_id ?? session.metadata?.orderId ?? null;
    if (orderId) {
      await prisma.order.updateMany({
        where: { id: orderId, provider: "stripe" },
        data: {
          status: "paid",
          providerRef: session.id,
        },
      });
      const paidOrder = await prisma.order.findFirst({
        where: { id: orderId, provider: "stripe" },
        select: {
          userId: true,
          billingJson: true,
          shippingJson: true,
        },
      });
      if (paidOrder?.userId) {
        await syncOrderAddressesToUserAccount(
          paidOrder.userId,
          paidOrder.billingJson,
          paidOrder.shippingJson,
        );
      }
      await notifyMerchantOrderPaid(orderId);
    }
  }

  return NextResponse.json({ received: true });
}
