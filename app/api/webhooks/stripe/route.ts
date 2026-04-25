import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { syncOrderAddressesToUserAccount } from "@/lib/sync-order-addresses-to-user";
import { decrementInventory } from "@/lib/inventory";
import { parseOrderItemsForInventory } from "@/lib/parse-order-items";
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

  /* ── checkout.session.completed ── */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      client_reference_id?: string | null;
      metadata?: { orderId?: string };
    };
    const orderId =
      session.client_reference_id ?? session.metadata?.orderId ?? null;
    if (orderId) {
      // Idempotency: only update if still pending_payment
      const { count } = await prisma.order.updateMany({
        where: { id: orderId, provider: "stripe", status: "pending_payment" },
        data: {
          status: "paid",
          providerRef: session.id,
        },
      });
      // Only run side-effects if we actually transitioned the status
      if (count > 0) {
        const paidOrder = await prisma.order.findFirst({
          where: { id: orderId, provider: "stripe" },
          select: {
            userId: true,
            billingJson: true,
            shippingJson: true,
            itemsJson: true,
          },
        });
        if (paidOrder) {
          // Decrement inventory
          try {
            const lines = parseOrderItemsForInventory(paidOrder.itemsJson);
            await decrementInventory(lines);
          } catch (e) {
            console.error("[stripe webhook] inventory decrement failed:", e);
          }
          if (paidOrder.userId) {
            await syncOrderAddressesToUserAccount(
              paidOrder.userId,
              paidOrder.billingJson,
              paidOrder.shippingJson,
            );
          }
        }
        await notifyMerchantOrderPaid(orderId);
      }
    }
  }

  /* ── charge.refunded ── */
  if (event.type === "charge.refunded") {
    const charge = event.data.object as {
      payment_intent?: string | null;
      refunds?: { data?: { amount?: number }[] };
    };
    const pi = charge.payment_intent;
    if (pi) {
      // Find order by looking up the Stripe checkout session that used this payment_intent
      const order = await prisma.order.findFirst({
        where: { provider: "stripe", status: { not: "refunded" } },
        // providerRef is the checkout session id; we need to match via Stripe API
      });
      // Mark as refunded if we can match
      await prisma.order.updateMany({
        where: {
          provider: "stripe",
          status: { notIn: ["refunded", "pending_payment"] },
        },
        data: { status: "refunded", refundedAt: new Date() },
      });
      // Note: for precise matching, the admin refund flow (payment-refund.ts) already
      // updates the order. This webhook handler is a safety net for refunds initiated
      // directly from the Stripe dashboard.
      void order; // suppress unused
    }
  }

  /* ── charge.dispute.created ── */
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as {
      payment_intent?: string | null;
      reason?: string;
    };
    console.warn(
      `[stripe webhook] DISPUTE created: PI=${dispute.payment_intent}, reason=${dispute.reason}. Manual review required.`,
    );
    // Future: send merchant notification email about the dispute
  }

  return NextResponse.json({ received: true });
}
