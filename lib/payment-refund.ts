import type { Order } from "@prisma/client";
import {
  paypalGetCaptureIdFromOrder,
  paypalRefundCapture,
} from "@/lib/paypal";
import { getStripe } from "@/lib/stripe";
import { restoreInventory } from "@/lib/inventory";
import { parseOrderItemsForInventory } from "@/lib/parse-order-items";
import { reverseAffiliateCommissionLedgerForOrder } from "@/lib/affiliate-commission-ledger";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
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

    // Send refund confirmation email to buyer
    try {
      await sendBuyerRefundEmail(order, refundAmountCents, isFullRefund);
    } catch (e) {
      console.error("[refund] buyer email failed:", e);
    }

    try {
      await reverseAffiliateCommissionLedgerForOrder({
        orderId: order.id,
        reason: isFullRefund ? "full_refund" : "partial_refund",
        refundAmountCents,
      });
    } catch (e) {
      console.error("[refund] affiliate ledger reversal failed:", e);
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

/* ── Buyer refund notification email ── */

async function sendBuyerRefundEmail(
  order: Order,
  refundAmountCents: number,
  isFullRefund: boolean,
) {
  const base = emailPublicBaseUrl();
  const code =
    order.merchantOrderCode || order.id.slice(-8).toUpperCase();
  const refundUsd = `$${(refundAmountCents / 100).toFixed(2)}`;
  const orderUsd = `$${(order.totalCents / 100).toFixed(2)}`;
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";

  const subject = isFullRefund
    ? `Refund processed for order #${code} · HUMPBUCK`
    : `Partial refund processed for order #${code} · HUMPBUCK`;

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="margin:0 0 16px">Your Refund Has Been Processed</h2>
      <p>Hi there,</p>
      <p>We've processed a ${isFullRefund ? "full" : "partial"} refund for your order.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px">
        <tr style="background:#f9fafb">
          <td style="padding:12px;color:#666;border-bottom:1px solid #e5e7eb">Order</td>
          <td style="padding:12px;font-weight:600;border-bottom:1px solid #e5e7eb">#${code}</td>
        </tr>
        <tr>
          <td style="padding:12px;color:#666;border-bottom:1px solid #e5e7eb">Order total</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb">${orderUsd}</td>
        </tr>
        <tr style="background:#f0fdf4">
          <td style="padding:12px;color:#666">Refund amount</td>
          <td style="padding:12px;font-weight:600;color:#16a34a">${refundUsd}</td>
        </tr>
      </table>
      <p style="font-size:14px;color:#666">
        The refund has been sent to your original payment method
        (${order.provider === "stripe" ? "card" : "PayPal"}).
        Depending on your bank, it may take <strong>3–10 business days</strong> to appear on your statement.
      </p>
      <p style="margin-top:20px">
        <a href="${base}/account/orders" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.05em">
          VIEW YOUR ORDERS
        </a>
      </p>
      <p style="margin-top:24px;font-size:13px;color:#999">
        Questions? Contact us at
        <a href="mailto:${supportEmail}" style="color:#666">${supportEmail}</a>
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
      <p style="font-size:11px;color:#bbb;text-align:center">HUMPBUCK · humpbuck.com</p>
    </div>
  `;

  await sendTransactionalEmail({
    to: order.email,
    subject,
    htmlContent,
  });
}
