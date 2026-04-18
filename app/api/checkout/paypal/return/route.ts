import { NextResponse } from "next/server";
import { notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { paypalCaptureOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

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

  await prisma.order.updateMany({
    where: { provider: "paypal", providerRef: orderId },
    data: { status: "paid" },
  });

  const paid = await prisma.order.findFirst({
    where: { provider: "paypal", providerRef: orderId },
    select: { id: true },
  });
  if (paid) {
    await notifyMerchantOrderPaid(paid.id);
  }

  const base = new URL(req.url).origin;
  return NextResponse.redirect(
    `${base}/checkout/success?paypal_order_id=${encodeURIComponent(orderId)}`,
  );
}
