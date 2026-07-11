import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { finalizePaidStripeOrder } from "@/lib/stripe-checkout-finalize";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { stripeSessionBuyerEmail } from "@/lib/order-buyer-email";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Order } from "@prisma/client";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripeClient = stripe;

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

  /* ── payment_intent.succeeded (Payment Element) ── */
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as {
      id: string;
      metadata?: { orderId?: string };
      receipt_email?: string | null;
    };
    const orderId = pi.metadata?.orderId ?? null;
    if (orderId) {
      try {
        await finalizePaidStripeOrder(orderId, pi.id, pi.receipt_email);
      } catch (e) {
        console.error("[stripe webhook] payment_intent.succeeded finalize failed:", e);
      }
    }
  }

  /* ── checkout.session.completed (legacy hosted Checkout) ── */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      client_reference_id?: string | null;
      metadata?: { orderId?: string };
      customer_email?: string | null;
      customer_details?: { email?: string | null } | null;
      payment_intent?: string | { id?: string } | null;
    };
    const orderId =
      session.client_reference_id ?? session.metadata?.orderId ?? null;
    if (orderId) {
      const stripeBuyerEmail = stripeSessionBuyerEmail(session);
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id;
      try {
        await finalizePaidStripeOrder(orderId, paymentIntentId, stripeBuyerEmail);
      } catch (e) {
        console.error("[stripe webhook] checkout.session.completed finalize failed:", e);
      }
    }
  }

  async function findStripeOrderByPaymentIntent(paymentIntentId: string): Promise<Order | null> {
    const direct = await prisma.order.findFirst({
      where: {
        provider: "stripe",
        providerRef: paymentIntentId,
        deletedAt: null,
      },
    });
    if (direct) return direct;

    try {
      const sessions = await stripeClient.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });
      const csId = sessions.data[0]?.id;
      if (!csId) return null;
      return prisma.order.findFirst({
        where: {
          provider: "stripe",
          providerRef: csId,
          deletedAt: null,
        },
      });
    } catch {
      return null;
    }
  }

  /* ── charge.refunded ── */
  if (event.type === "charge.refunded") {
    const charge = event.data.object as {
      id: string;
      payment_intent?: string | null;
      amount_refunded?: number;
    };
    const pi = charge.payment_intent;
    if (pi && typeof pi === "string") {
      try {
        const order = await findStripeOrderByPaymentIntent(pi);
        if (order && order.status !== "refunded" && order.status !== "pending_payment") {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "refunded",
                refundedAt: new Date(),
                refundAmountCents: charge.amount_refunded ?? order.totalCents,
              },
            });
            const refundAmountCents = charge.amount_refunded ?? order.totalCents;
            const refundUsd = `$${(refundAmountCents / 100).toFixed(2)}`;
            const merchantEmail =
              process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
            const supportEmail =
              process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";
            const base = emailPublicBaseUrl();
            const orderCode = order.merchantOrderCode || order.id.slice(-8).toUpperCase();

            const buyerResult = await sendTransactionalEmail({
              to: order.email,
              subject: `Refund processed for order #${orderCode} · HUMPBUCK`,
              htmlContent: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
                  <h2 style="margin:0 0 16px">Your Refund Has Been Processed</h2>
                  <p>We've received a refund confirmation from Stripe for your order.</p>
                  <p style="margin:12px 0 0 0"><strong>Order:</strong> #${orderCode}</p>
                  <p style="margin:8px 0 0 0"><strong>Refund amount:</strong> ${refundUsd}</p>
                  <p style="margin:12px 0 0 0;font-size:14px;color:#666">
                    The refund has been sent to your original payment method.
                    Depending on your bank, it may take 3-10 business days to appear.
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
                </div>
              `,
            });

            const merchantResult = await sendTransactionalEmail({
              to: merchantEmail,
              subject: `Stripe refund processed #${orderCode} · HUMPBUCK`,
              htmlContent: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
                  <h2 style="margin:0 0 16px">Stripe Refund Confirmed</h2>
                  <p>Stripe reported a refund for this order.</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px 0;color:#666">Order</td><td style="padding:8px 0;font-weight:600">#${orderCode}</td></tr>
                    <tr><td style="padding:8px 0;color:#666">Buyer email</td><td style="padding:8px 0">${order.email}</td></tr>
                    <tr><td style="padding:8px 0;color:#666">Refund amount</td><td style="padding:8px 0;font-weight:600">${refundUsd}</td></tr>
                  </table>
                  <p>
                    <a href="${base}/admin-ouhao/orders/${order.id}">View order in admin</a>
                  </p>
                </div>
              `,
            });

            if (!buyerResult.ok) {
              console.error("[stripe webhook] buyer refund email failed:", buyerResult.error);
            }
            if (!merchantResult.ok) {
              console.error("[stripe webhook] merchant refund email failed:", merchantResult.error);
            }
            console.log(
              `[stripe webhook] charge.refunded: order ${order.id} marked refunded (PI=${pi})`,
            );
        }
      } catch (e) {
        console.error("[stripe webhook] charge.refunded lookup failed:", e);
      }
    }
  }

  /* ── charge.dispute.created ── */
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as {
      id: string;
      payment_intent?: string | null;
      reason?: string;
      amount?: number;
    };
    const pi = dispute.payment_intent;
    console.warn(
      `[stripe webhook] DISPUTE created: id=${dispute.id}, PI=${pi}, reason=${dispute.reason}, amount=${dispute.amount}`,
    );

    // Find the order and notify merchant
    let orderId: string | null = null;
    let orderEmail = "";
    if (pi && typeof pi === "string") {
      try {
        const order = await findStripeOrderByPaymentIntent(pi);
        if (order) {
          orderId = order.id;
          orderEmail = order.email;
        }
      } catch (e) {
        console.error("[stripe webhook] dispute order lookup failed:", e);
      }
    }

    // Send urgent email to merchant
    const merchantEmail =
      process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
    const base = emailPublicBaseUrl();
    const disputeAmount = dispute.amount
      ? `$${(dispute.amount / 100).toFixed(2)}`
      : "unknown";
    const orderLink = orderId
      ? `<a href="${base}/admin-ouhao/orders/${orderId}">View order in admin</a>`
      : "Order could not be matched";

    await sendTransactionalEmail({
      to: merchantEmail,
      subject: `⚠️ DISPUTE filed — ${disputeAmount} · HUMPBUCK`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#dc2626;margin:0 0 16px">Payment Dispute Filed</h2>
          <p>A customer has filed a dispute (chargeback) with their bank.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#666">Amount</td><td style="padding:8px 0;font-weight:600">${disputeAmount}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Reason</td><td style="padding:8px 0">${dispute.reason ?? "not specified"}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Dispute ID</td><td style="padding:8px 0;font-family:monospace;font-size:13px">${dispute.id}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Customer email</td><td style="padding:8px 0">${orderEmail || "unknown"}</td></tr>
          </table>
          <p>${orderLink}</p>
          <p style="margin-top:20px;padding:12px;background:#fef3c7;border-radius:8px;font-size:14px">
            <strong>Action required:</strong> Log in to your
            <a href="https://dashboard.stripe.com/disputes">Stripe Dashboard → Disputes</a>
            to respond within the deadline. Failing to respond will result in losing the dispute.
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ received: true });
}
