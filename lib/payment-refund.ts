import type { Order } from "@prisma/client";
import {
  paypalGetCaptureIdFromOrder,
  paypalRefundCapture,
} from "@/lib/paypal";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

function formatUsdTwoDecimals(totalCents: number): string {
  return (totalCents / 100).toFixed(2);
}

/**
 * Refund the full captured amount via Stripe or PayPal and mark the order refunded.
 */
export async function refundOrderById(orderId: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { ok: false, error: "Order not found" };
  }
  if (order.status === "refunded") {
    return { ok: false, error: "Order is already refunded" };
  }
  if (order.status === "pending_payment") {
    return { ok: false, error: "No payment to refund" };
  }
  const ref = order.providerRef?.trim();
  if (!ref) {
    return {
      ok: false,
      error:
        "No payment reference on file — this order may be a manual/test entry.",
    };
  }

  const provider = order.provider.toLowerCase();
  if (provider === "stripe") {
    return refundStripe(order);
  }
  if (provider === "paypal") {
    return refundPayPal(order);
  }
  return {
    ok: false,
    error: `Automatic refunds are not configured for ${order.provider}.`,
  };
}

async function refundStripe(
  order: Order,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured" };
  }
  const sessionId = order.providerRef!.trim();
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const pi = session.payment_intent;
    const paymentIntentId =
      typeof pi === "string" ? pi : pi && "id" in pi ? pi.id : null;
    if (!paymentIntentId) {
      return {
        ok: false,
        error: "Could not resolve Stripe payment for this checkout session.",
      };
    }
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: order.totalCents,
      reason: "requested_by_customer",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("already been refunded") ||
      msg.includes("has already been refunded")
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "refunded" },
      });
      return { ok: true };
    }
    return { ok: false, error: msg };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "refunded" },
  });
  return { ok: true };
}

async function refundPayPal(
  order: Order,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const paypalOrderId = order.providerRef!.trim();
  try {
    const captureId = await paypalGetCaptureIdFromOrder(paypalOrderId);
    if (!captureId) {
      return {
        ok: false,
        error:
          "No PayPal capture found — payment may not be completed for this order.",
      };
    }
    await paypalRefundCapture(
      captureId,
      formatUsdTwoDecimals(order.totalCents),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.toLowerCase().includes("already") &&
      msg.toLowerCase().includes("refund")
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "refunded" },
      });
      return { ok: true };
    }
    return { ok: false, error: msg };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "refunded" },
  });
  return { ok: true };
}
