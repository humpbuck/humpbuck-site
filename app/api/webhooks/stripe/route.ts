import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { syncOrderAddressesToUserAccount } from "@/lib/sync-order-addresses-to-user";
import { decrementInventory } from "@/lib/inventory";
import { parseOrderItemsForInventory } from "@/lib/parse-order-items";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
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
      const { count } = await prisma.order.updateMany({
        where: { id: orderId, provider: "stripe", status: "pending_payment" },
        data: {
          status: "paid",
          providerRef: session.id,
        },
      });
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
      id: string;
      payment_intent?: string | null;
      amount_refunded?: number;
    };
    const pi = charge.payment_intent;
    if (pi && typeof pi === "string") {
      // Look up the checkout session that used this payment_intent
      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi,
          limit: 1,
        });
        const csId = sessions.data[0]?.id;
        if (csId) {
          // Match the specific order by providerRef (checkout session id)
          const order = await prisma.order.findFirst({
            where: {
              provider: "stripe",
              providerRef: csId,
              status: { notIn: ["refunded", "pending_payment"] },
              deletedAt: null,
            },
          });
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "refunded",
                refundedAt: new Date(),
                refundAmountCents: charge.amount_refunded ?? order.totalCents,
              },
            });
            console.log(
              `[stripe webhook] charge.refunded: order ${order.id} marked refunded (PI=${pi})`,
            );
          }
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
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi,
          limit: 1,
        });
        const csId = sessions.data[0]?.id;
        if (csId) {
          const order = await prisma.order.findFirst({
            where: { provider: "stripe", providerRef: csId, deletedAt: null },
            select: { id: true, email: true, merchantOrderCode: true },
          });
          if (order) {
            orderId = order.id;
            orderEmail = order.email;
          }
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
