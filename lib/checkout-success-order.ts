import type { Order, OrderItemSnapshot } from "@prisma/client";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export type CheckoutSuccessOrder = Order & { items: OrderItemSnapshot[] };

const orderInclude = {
  items: { orderBy: { id: "asc" as const } },
} as const;

async function verifyStripeCheckoutSession(
  stripeSessionId: string,
  orderId: string,
): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const linked =
      session.client_reference_id ?? session.metadata?.orderId ?? null;
    return linked === orderId;
  } catch {
    return false;
  }
}

/**
 * Load an order for the post-payment success page.
 * - Logged-in buyers: must own the order.
 * - Guest checkout: order has no userId (id in URL is the secret).
 * - Stripe return without auth cookie: `session_id` must match the order.
 */
export async function loadCheckoutSuccessOrder(params: {
  orderId: string;
  sessionUserId?: string;
  stripeSessionId?: string;
  paypalOrderId?: string;
}): Promise<CheckoutSuccessOrder | null> {
  const { orderId, sessionUserId, stripeSessionId, paypalOrderId } = params;

  if (paypalOrderId) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        providerRef: paypalOrderId,
        deletedAt: null,
      },
      include: orderInclude,
    });
  }

  if (stripeSessionId) {
    const ok = await verifyStripeCheckoutSession(stripeSessionId, orderId);
    if (!ok) return null;
    return prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: orderInclude,
    });
  }

  if (sessionUserId) {
    return prisma.order.findFirst({
      where: { id: orderId, userId: sessionUserId, deletedAt: null },
      include: orderInclude,
    });
  }

  return prisma.order.findFirst({
    where: { id: orderId, userId: null, deletedAt: null },
    include: orderInclude,
  });
}
