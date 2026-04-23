import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { notifyCustomerOrderShipped } from "@/lib/customer-shipped-email";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUS = new Set([
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "cancelled",
  "refunded",
]);

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: {
    status?: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    merchantOrderCode?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    status?: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    merchantOrderCode?: string | null;
  } = {};

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.carrier !== undefined) {
    data.carrier = body.carrier === "" ? null : String(body.carrier).trim();
  }
  if (body.trackingNumber !== undefined) {
    data.trackingNumber =
      body.trackingNumber === "" ? null : String(body.trackingNumber).trim();
  }
  if (body.merchantOrderCode !== undefined) {
    const raw = String(body.merchantOrderCode ?? "").trim();
    data.merchantOrderCode = raw === "" ? null : raw.slice(0, 64);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  let updated;
  try {
    updated = await prisma.order.update({
      where: { id },
      data,
    });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let shipmentEmail: Awaited<
    ReturnType<typeof notifyCustomerOrderShipped>
  > | null = null;
  try {
    shipmentEmail = await notifyCustomerOrderShipped(updated.id, updated);
  } catch (e) {
    console.error("[admin orders PATCH] notifyCustomerOrderShipped", e);
    shipmentEmail = {
      sent: false,
      reason: "build_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  return NextResponse.json({ ok: true, shipmentEmail });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const deleted = await prisma.order.deleteMany({ where: { id } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
