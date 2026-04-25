import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ABANDONED_THRESHOLD_HOURS = 24;

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

  return NextResponse.json({
    ok: true,
    cleaned: result.count,
    threshold: `${ABANDONED_THRESHOLD_HOURS}h`,
  });
}
