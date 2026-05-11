import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { upsertAffiliateCommissionLedgerForOrder } from "@/lib/affiliate-commission-ledger";
import { notifyCustomerOrderShipped } from "@/lib/customer-shipped-email";
import { restoreInventory } from "@/lib/inventory";
import { parseOrderItemsForInventory } from "@/lib/parse-order-items";
import { syncAffiliateGrowthTierByOrderCount } from "@/lib/affiliate-tier-growth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUS = new Set([
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
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

  // Fetch current order to detect status transitions
  const current = await prisma.order.findUnique({ where: { id } });
  if (!current || current.deletedAt) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

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
  const now = new Date();
  if (data.status === "shipped" && current.status !== "shipped") {
    (data as typeof data & { shippedAt?: Date | null }).shippedAt = now;
  }
  if (data.status === "delivered" && current.status !== "delivered") {
    (data as typeof data & { deliveredAt?: Date | null; deliveryConfirmedBy?: string | null })
      .deliveredAt = now;
    (data as typeof data & { deliveredAt?: Date | null; deliveryConfirmedBy?: string | null })
      .deliveryConfirmedBy = "admin";
  }
  try {
    updated = await prisma.order.update({
      where: { id },
      data,
    });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Restore inventory when order is cancelled (only if transitioning from a paid state)
  const paidStates = new Set(["paid", "processing", "shipped"]);
  if (
    data.status === "cancelled" &&
    paidStates.has(current.status)
  ) {
    try {
      const lines = current.items.map((line) => ({
        slug: line.productSlug,
        qty: line.qty,
        variantId: line.variantId ?? undefined,
      }));
      await restoreInventory(lines);
    } catch (e) {
      console.error("[admin orders PATCH] inventory restore failed:", e);
    }
  }

  // Only send shipment email when status TRANSITIONS to "shipped" (not on every PATCH)
  let shipmentEmail: Awaited<
    ReturnType<typeof notifyCustomerOrderShipped>
  > | null = null;
  const statusChangedToShipped =
    data.status === "shipped" && current.status !== "shipped";

  if (statusChangedToShipped) {
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
  }

  if (data.status === "delivered" && current.status !== "delivered") {
    await upsertAffiliateCommissionLedgerForOrder(updated.id);
  }
  if (
    current.affiliateId &&
    data.status !== undefined &&
    data.status !== current.status
  ) {
    await syncAffiliateGrowthTierByOrderCount(current.affiliateId);
  }

  return NextResponse.json({ ok: true, shipmentEmail });
}

/** Soft-delete: set deletedAt instead of permanent removal. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
