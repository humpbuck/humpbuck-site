import { NextResponse } from "next/server";
import { notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { paypalCaptureOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { syncOrderAddressesToUserAccount } from "@/lib/sync-order-addresses-to-user";
import { decrementInventory } from "@/lib/inventory";
import { parseOrderItemsForInventory } from "@/lib/parse-order-items";

/** PayPal redirects here with ?token=PAYPAL_ORDER_ID */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("token");
  if (!orderId) {
    return NextResponse.redirect(new URL("/cart?error=paypal", req.url));
  }

  try {
    await paypalCaptureOrder(orderId);
  } catch {
    return NextResponse.redirect(new URL("/cart?error=paypal_capture", req.url));
  }

  // Idempotency: only update if still pending_payment
  const { count } = await prisma.order.updateMany({
    where: { provider: "paypal", providerRef: orderId, status: "pending_payment" },
    data: { status: "paid" },
  });

  const paid = await prisma.order.findFirst({
    where: { provider: "paypal", providerRef: orderId },
    select: {
      id: true,
      userId: true,
      billingJson: true,
      shippingJson: true,
      itemsJson: true,
    },
  });
  if (paid && count > 0) {
    // Decrement inventory
    try {
      const lines = parseOrderItemsForInventory(paid.itemsJson);
      await decrementInventory(lines);
    } catch (e) {
      console.error("[paypal return] inventory decrement failed:", e);
    }
    if (paid.userId) {
      await syncOrderAddressesToUserAccount(
        paid.userId,
        paid.billingJson,
        paid.shippingJson,
      );
    }
    await notifyMerchantOrderPaid(paid.id);
  }

  const base = new URL(req.url).origin;
  return NextResponse.redirect(
    `${base}/checkout/success?paypal_order_id=${encodeURIComponent(orderId)}`,
  );
}
