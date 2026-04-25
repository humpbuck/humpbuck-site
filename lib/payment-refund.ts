import type { Order } from "@prisma/client";
import {
  paypalGetCaptureIdFromOrder,
  paypalRefundCapture,
} from "@/lib/paypal";
import { getStripe } from "@/lib/stripe";
import { restoreInventory } from "@/lib/inventory";
import { parseOrderItemsForInventory } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";

function formatUsdTwoDecimals(totalCents: number): string {
  return (totalCents / 100).toFixed(2);
}

/**
 * Refund an order via Stripe or PayPal and mark the order refunded.
 * Supports full and partial refunds. Records reason and amount.
 */
export async function refundOrderById(
  orderId: string,
  opts?: { amountCents?: number; reason?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  const refundAmountCents = opts?.amountCents ?? order.totalCents;
  if (refundAmountCents <= 0 || refundAmountCents > order.totalCents) {
    return { ok: false, error: "Invalid refund amount" };
  }

  const isFullRefund = refundAmountCents === order.totalCents;
  const provider = order.provider.toLowerCase();

  let result: { ok: true } | { ok: false; error: string };
  if (provider === "stripe") {
    result = await refundStripe(order, refundAmountCents);
  } else if (provider === "paypal") {
    result = await refundPayPal(order, refundAmountCents);
  } else {
    return {
      ok: false,
      error: `Automatic refunds are not configured for ${order.provider}.`,
    };
  }

  if (result.ok) {
    // Update order with refund details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: isFullRefund ? "refunded" : order.status,
        refundAmountCents,
        refundReason: opts?.reason?.trim() || null,
        refundedAt: new Date(),
      },
    });

    // Restore inventory on full refund
    if (isFullRefund) {
      try {
        const lines = parseOrderItemsForInventory(order.itemsJson);
        await restoreInventory(lines);
      } catch (e) {
        console.error("[refund] inventory restore failed:", e);
      }
    }
  }

  return result;
}

async function refundStripe(
  order: Order,
  amountCents: number,
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
      amount: amountCents,
      reason: "requested_by_customer",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("already been refunded") ||
      msg.includes("has already been refunded")
    ) {
      return { ok: true };
    }
    return { ok: false, error: msg };
  }

  return { ok: true };
}

async function refundPayPal(
  order: Order,
  amountCents: number,
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
      formatUsdTwoDecimals(amountCents),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.toLowerCase().includes("already") &&
      msg.toLowerCase().includes("refund")
    ) {
      return { ok: true };
    }
    return { ok: false, error: msg };
  }

  return { ok: true };
}
