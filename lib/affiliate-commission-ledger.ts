import { prisma } from "@/lib/prisma";

const DEFAULT_HOLD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function computeCommissionCents(params: {
  type: string;
  value: number;
  orderTotalCents: number;
}): number {
  if (params.type === "fixed") {
    return Math.max(0, Math.round(params.value * 100));
  }
  const pct = Math.max(0, params.value);
  return Math.max(0, Math.round(params.orderTotalCents * (pct / 100)));
}

export async function upsertAffiliateCommissionLedgerForOrder(
  orderId: string,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      affiliate: {
        include: { tier: true },
      },
    },
  });
  if (!order || !order.affiliateId) return;
  if (order.status !== "delivered") return;

  const tier = order.affiliate?.tier;
  const commissionType = tier?.commissionType ?? "percent";
  const commissionValue = Number(tier?.commissionValue ?? 0);
  const commissionCents = computeCommissionCents({
    type: commissionType,
    value: commissionValue,
    orderTotalCents: order.totalCents,
  });
  const deliveredAt = order.deliveredAt ?? new Date();
  const eligibleAt = addDays(deliveredAt, DEFAULT_HOLD_DAYS);
  const status = eligibleAt <= new Date() ? "eligible" : "pending";

  await prisma.affiliateCommissionLedger.upsert({
    where: { orderId: order.id },
    create: {
      affiliateId: order.affiliateId,
      orderId: order.id,
      orderTotalCents: order.totalCents,
      commissionType,
      commissionValue,
      commissionCents,
      holdDays: DEFAULT_HOLD_DAYS,
      eligibleAt,
      status,
    },
    update: {
      affiliateId: order.affiliateId,
      orderTotalCents: order.totalCents,
      commissionType,
      commissionValue,
      commissionCents,
      holdDays: DEFAULT_HOLD_DAYS,
      eligibleAt,
      status,
      reversalReason: null,
      reversedAt: null,
      reversedCommissionCents: 0,
    },
  });
}

export async function reverseAffiliateCommissionLedgerForOrder(params: {
  orderId: string;
  reason: string;
  refundAmountCents: number;
}): Promise<void> {
  const ledger = await prisma.affiliateCommissionLedger.findUnique({
    where: { orderId: params.orderId },
  });
  if (!ledger) return;

  const ratio = ledger.orderTotalCents > 0
    ? Math.min(1, Math.max(0, params.refundAmountCents / ledger.orderTotalCents))
    : 1;
  const reversedCommissionCents = Math.min(
    ledger.commissionCents,
    Math.round(ledger.commissionCents * ratio),
  );

  await prisma.affiliateCommissionLedger.update({
    where: { id: ledger.id },
    data: {
      status: "reversed",
      reversedCommissionCents,
      reversalReason: params.reason.slice(0, 200),
      reversedAt: new Date(),
    },
  });
}

