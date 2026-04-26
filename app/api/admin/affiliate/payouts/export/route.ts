import { NextResponse } from "next/server";
import { getAdminToken, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_HOLD_DAYS = 30;

export async function GET(req: Request) {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const holdDaysRaw = Number(url.searchParams.get("holdDays") ?? DEFAULT_HOLD_DAYS);
  const holdDays = Number.isFinite(holdDaysRaw) && holdDaysRaw > 0
    ? Math.floor(holdDaysRaw)
    : DEFAULT_HOLD_DAYS;

  const eligibleBefore = new Date(
    Date.now() - holdDays * 24 * 60 * 60 * 1000,
  );

  const ledgers = await prisma.affiliateCommissionLedger.findMany({
    where: {
      status: "eligible",
      eligibleAt: { lte: eligibleBefore },
      paidAt: null,
      reversedAt: null,
    },
    include: {
      affiliate: {
        include: {
          user: { select: { email: true, displayName: true } },
          tier: true,
        },
      },
      order: {
        select: {
          id: true,
          totalCents: true,
          affiliateAttribution: true,
          deliveredAt: true,
        },
      },
    },
    orderBy: { eligibleAt: "asc" },
  });
  const rows: string[][] = [
    [
      "orderId",
      "affiliateId",
      "affiliatePid",
      "affiliateName",
      "affiliateEmail",
      "tierName",
      "commissionType",
      "commissionValue",
      "orderTotalUsd",
      "commissionUsd",
      "commissionStatus",
      "eligibleAt",
      "attribution",
      "deliveredAt",
    ],
  ];

  for (const l of ledgers) {
    const orderTotalUsd = l.orderTotalCents / 100;
    const commissionUsd = l.commissionCents / 100;
    rows.push([
      l.orderId,
      l.affiliateId,
      l.affiliate?.pid ?? "",
      l.affiliate?.user.displayName || "",
      l.affiliate?.user.email || "",
      l.affiliate?.tier?.name ?? "",
      l.commissionType,
      l.commissionValue.toFixed(2),
      orderTotalUsd.toFixed(2),
      commissionUsd.toFixed(2),
      l.status,
      l.eligibleAt.toISOString(),
      l.order.affiliateAttribution ?? "",
      l.order.deliveredAt ? l.order.deliveredAt.toISOString() : "",
    ]);
  }

  const csv = rows
    .map((r) =>
      r
        .map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`)
        .join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="affiliate-payouts-${holdDays}d.csv"`,
      "cache-control": "no-store",
    },
  });
}

