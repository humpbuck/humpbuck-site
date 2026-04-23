import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseShippingRecord } from "@/lib/admin/order-ui";
import { resolveOrderAddressJson } from "@/lib/resolve-order-addresses";
import {
  notifyBuyerShippingAddressUpdated,
  notifyMerchantBuyerUpdatedShippingAddress,
} from "@/lib/merchant-order-email";
import { prisma } from "@/lib/prisma";

const EDITABLE_STATUS = new Set(["paid", "processing"]);

/** Preserve checkout metadata on `shippingJson` when the buyer edits the address. */
const PRESERVE_SHIPPING_KEYS = ["shippingMethod", "shippingEstimateCny"] as const;

const IGNORE_ADDRESS_COMPARE_KEYS = new Set<string>(PRESERVE_SHIPPING_KEYS);

/** Stable comparison of address fields only (ignores preserved checkout metadata). */
function shippingAddressComparableSignature(rec: Record<string, string>): string {
  const keys = Object.keys(rec)
    .filter((k) => !IGNORE_ADDRESS_COMPARE_KEYS.has(k))
    .sort();
  const norm: Record<string, string> = {};
  for (const k of keys) {
    norm[k] = String(rec[k] ?? "").trim();
  }
  return JSON.stringify(norm);
}

export async function PATCH(
  req: Request,
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

  let body: { shipping?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shipIn = body.shipping;
  if (!shipIn || typeof shipIn !== "object") {
    return NextResponse.json({ error: "shipping is required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!EDITABLE_STATUS.has(order.status)) {
    return NextResponse.json(
      { error: "This order cannot be edited." },
      { status: 400 },
    );
  }

  if (order.trackingNumber?.trim()) {
    return NextResponse.json(
      { error: "Shipping address can no longer be changed (tracking already added)." },
      { status: 400 },
    );
  }

  const resolved = resolveOrderAddressJson({
    billing: shipIn,
    shipping: shipIn,
  });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  let nextShip: Record<string, string>;
  try {
    nextShip = JSON.parse(resolved.shippingJson!) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid address payload" }, { status: 400 });
  }

  const prev = parseShippingRecord(order.shippingJson);
  for (const k of PRESERVE_SHIPPING_KEYS) {
    const v = prev?.[k];
    if (v) nextShip[k] = v;
  }

  const oldSnapshot = prev ? { ...prev } : null;

  const prevSig = shippingAddressComparableSignature(prev ?? {});
  const nextSig = shippingAddressComparableSignature(nextShip);
  if (prevSig === nextSig) {
    return NextResponse.json({
      ok: true,
      unchanged: true,
      merchantNotified: false,
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { shippingJson: JSON.stringify(nextShip) },
  });

  const merchantEmail = await notifyMerchantBuyerUpdatedShippingAddress({
    orderId,
    buyerEmail: order.email,
    oldShipping: oldSnapshot,
    newShipping: nextShip,
  });
  if (!merchantEmail.ok) {
    console.error(
      "[buyer-shipping-update] merchant email failed:",
      merchantEmail.error,
    );
  }

  const buyerEmail = await notifyBuyerShippingAddressUpdated({
    orderId,
    buyerEmail: order.email,
    oldShipping: oldSnapshot,
    newShipping: nextShip,
  });
  if (!buyerEmail.ok) {
    console.error(
      "[buyer-shipping-update] buyer confirmation email failed:",
      buyerEmail.error,
    );
  }

  return NextResponse.json({
    ok: true,
    unchanged: false,
    merchantNotified: merchantEmail.ok,
    buyerNotified: buyerEmail.ok,
  });
}
