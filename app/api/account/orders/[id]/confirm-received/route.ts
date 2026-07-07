import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true, status: true, deliveredAt: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "shipped") {
    return NextResponse.json(
      { error: "Only shipped orders can be confirmed as received." },
      { status: 400 },
    );
  }
  if (order.deliveredAt) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "delivered",
      deliveredAt: new Date(),
      deliveryConfirmedBy: "buyer",
    },
  });
  return NextResponse.json({ ok: true, unchanged: false });
}

