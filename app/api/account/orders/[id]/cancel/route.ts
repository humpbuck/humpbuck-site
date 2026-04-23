import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buyerCancelBlockedReason } from "@/lib/account-buyer-order";
import { sendOrderCancelledNotifications } from "@/lib/order-cancelled-email";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await ctx.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const block = buyerCancelBlockedReason(order);
  if (block === "shipped") {
    return NextResponse.json(
      { error: "already_shipped", message: "This order has shipped and cannot be cancelled online." },
      { status: 409 },
    );
  }
  if (block === "not_eligible") {
    return NextResponse.json(
      { error: "not_eligible", message: "This order cannot be cancelled." },
      { status: 400 },
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });

  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const notify = await sendOrderCancelledNotifications(orderId);

  if (!notify.merchantOk) {
    console.error(
      "[buyer-cancel-order] merchant email failed:",
      notify.merchantError,
    );
  }
  if (!notify.buyerOk) {
    console.error(
      "[buyer-cancel-order] buyer email failed:",
      notify.buyerError,
    );
  }

  return NextResponse.json({
    ok: true,
    merchantNotified: notify.merchantOk,
    buyerNotified: notify.buyerOk,
  });
}
