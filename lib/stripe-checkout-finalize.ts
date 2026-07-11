import { notifyCustomerOrderPaid, notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { syncOrderAddressesToUserAccount } from "@/lib/sync-order-addresses-to-user";
import { decrementInventory } from "@/lib/inventory";
import { orderItemsFromOrder } from "@/lib/order-item-display";
import { prisma } from "@/lib/prisma";

/**
 * Mark a HUMPBUCK order paid after Stripe Payment Intent succeeds
 * (client return and/or webhook).
 */
export async function finalizePaidStripeOrder(
  orderId: string,
  paymentIntentId: string,
  buyerEmail?: string | null,
): Promise<void> {
  const piId = paymentIntentId.trim();
  if (!piId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.deletedAt) return;

  if (order.providerRef && order.providerRef !== piId) return;

  if (order.status === "paid" || order.status === "processing" || order.status === "shipped") {
    return;
  }

  if (order.status !== "pending_payment") return;

  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: "pending_payment" },
    data: {
      status: "paid",
      provider: "stripe",
      providerRef: piId,
      ...(buyerEmail?.trim() ? { email: buyerEmail.trim() } : {}),
    },
  });

  if (count === 0) return;

  const paidOrder = await prisma.order.findFirst({
    where: { id: orderId, provider: "stripe" },
    include: { items: true },
  });

  if (paidOrder) {
    try {
      const lines = orderItemsFromOrder(paidOrder).map((line) => ({
        slug: line.slug,
        qty: line.qty,
        variantId: line.variantId,
      }));
      await decrementInventory(lines);
    } catch (e) {
      console.error("[stripe finalize] inventory decrement failed:", e);
    }

    if (paidOrder.userId) {
      await syncOrderAddressesToUserAccount(
        paidOrder.userId,
        paidOrder.billingJson,
        paidOrder.shippingJson,
      );
    }
  }

  await notifyCustomerOrderPaid(orderId);
  await notifyMerchantOrderPaid(orderId);
}
