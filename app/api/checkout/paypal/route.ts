import { NextResponse } from "next/server";
import { notifyMerchantOrderPaid } from "@/lib/merchant-order-email";
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
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "create") {
    if (!body.totalUsd || !body.returnUrl || !body.cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = await paypalCreateOrder(body.totalUsd, body.returnUrl, body.cancelUrl);
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
      await notifyMerchantOrderPaid(order.id);
    }

    return NextResponse.json({ ok: true, capture: result });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
