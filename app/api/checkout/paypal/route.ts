import { NextResponse } from "next/server";
import { finalizePaidPayPalOrder } from "@/lib/paypal-checkout-finalize";
import { paypalCreateOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: {
    action?: "create" | "capture";
    orderId?: string;
    totalUsd?: string;
    returnUrl?: string;
    cancelUrl?: string;
    paypalOrderId?: string;
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
    await prisma.order.updateMany({
      where: { id: body.orderId, status: "pending_payment" },
      data: { provider: "paypal", providerRef: created.id },
    });
    return NextResponse.json({ ok: true, paypalOrderId: created.id, approvalUrl: created.approvalUrl });
  }

  if (body.action === "capture") {
    if (!body.orderId || !body.paypalOrderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      await finalizePaidPayPalOrder(body.orderId, body.paypalOrderId);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
