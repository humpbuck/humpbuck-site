import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ABANDONED_THRESHOLD_HOURS = 24;
const AUTO_CONFIRM_DAYS = 30;

/**
 * Cron endpoint: soft-delete abandoned pending_payment orders.
 * Protect with CRON_SECRET or Vercel's built-in cron auth.
 */
export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - ABANDONED_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  const result = await prisma.order.updateMany({
    where: {
      status: "pending_payment",
      createdAt: { lt: cutoff },
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  const deliveredNow = new Date();
  const shippedCutoff = new Date(
    Date.now() - AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
  );
  const autoDeliverCandidates = await prisma.order.findMany({
    where: {
      status: "shipped",
      shippedAt: { lt: shippedCutoff },
      deliveredAt: null,
      deletedAt: null,
    },
    select: { id: true },
    take: 500,
  });
  let autoDeliveredCount = 0;
  for (const row of autoDeliverCandidates) {
    const changed = await prisma.order.updateMany({
      where: {
        id: row.id,
        status: "shipped",
        deliveredAt: null,
      },
      data: {
        status: "delivered",
        deliveredAt: deliveredNow,
        deliveryConfirmedBy: "auto",
      },
    });
    if (changed.count > 0) {
      autoDeliveredCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    cleaned: result.count,
    threshold: `${ABANDONED_THRESHOLD_HOURS}h`,
    autoDelivered: autoDeliveredCount,
    autoConfirmWindow: `${AUTO_CONFIRM_DAYS}d`,
  });
}
