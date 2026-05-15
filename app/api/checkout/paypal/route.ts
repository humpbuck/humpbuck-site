import { NextResponse } from "next/server";
import { notifyCustomerOrderPaid, notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
import { paypalCaptureOrder, paypalCreateOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: {
    action?: "create" | "capture";
    orderId?: string;
    totalUsd?: string;
    returnUrl?: string;
    cancelUrl?: string;
    paypalOrderId?: string;
    affiliatePid?: string | null;
    trafficSource?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "create") {
    if (!body.totalUsd || !body.returnUrl || !body.cancelUrl || !body.orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const successUrl = new URL(body.returnUrl);
    successUrl.searchParams.set("orderId", body.orderId);
    successUrl.searchParams.set("provider", "paypal");

    const cancelUrl = new URL(body.cancelUrl);
    cancelUrl.searchParams.set("payment", "cancelled");
    cancelUrl.searchParams.set("provider", "paypal");
    cancelUrl.searchParams.set("orderId", body.orderId);

    const created = await paypalCreateOrder(body.totalUsd, successUrl.toString(), cancelUrl.toString());
    return NextResponse.json({ ok: true, paypalOrderId: created.id, approvalUrl: created.approvalUrl });
  }

  if (body.action === "capture") {
    if (!body.orderId || !body.paypalOrderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await paypalCaptureOrder(body.paypalOrderId);
    const order = await prisma.order.findUnique({ where: { id: body.orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "pending_payment") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          provider: "paypal",
          providerRef: body.paypalOrderId,
        },
      });
      await notifyCustomerOrderPaid(order.id);
      await notifyMerchantOrderPaid(order.id);
    }

    return NextResponse.json({ ok: true, capture: result });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
