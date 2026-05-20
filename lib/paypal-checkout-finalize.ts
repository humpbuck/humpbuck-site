import {
  notifyCustomerOrderPaid,
  notifyMerchantOrderPaid,
} from "@/lib/merchant-order-email";
import { paypalOrderBuyerEmail } from "@/lib/order-buyer-email";
import { paypalCaptureOrder, paypalGetOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

/**
 * Capture an approved PayPal Checkout order, mark the HUMPBUCK order paid,
 * sync payer email, and send merchant + buyer emails (buyer skipped if same as merchant inbox).
 */
export async function finalizePaidPayPalOrder(
  orderId: string,
  paypalOrderId: string,
): Promise<void> {
  const paypalId = paypalOrderId.trim();
  if (!paypalId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) return;

  if (order.providerRef && order.providerRef !== paypalId) return;

  if (order.status === "paid" || order.status === "processing" || order.status === "shipped") {
    return;
  }

  if (order.status !== "pending_payment") return;

  let payerPayload: unknown;
  try {
    payerPayload = await paypalCaptureOrder(paypalId);
  } catch {
    const existing = await paypalGetOrder(paypalId);
    if (existing.status !== "COMPLETED") throw new Error("PayPal capture failed");
    payerPayload = existing;
  }

  const buyerEmail = paypalOrderBuyerEmail(payerPayload);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "paid",
      provider: "paypal",
      providerRef: paypalId,
      ...(buyerEmail ? { email: buyerEmail } : {}),
    },
  });

  await notifyCustomerOrderPaid(orderId);
  await notifyMerchantOrderPaid(orderId);
}
