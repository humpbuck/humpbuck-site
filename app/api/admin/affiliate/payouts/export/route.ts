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

  const orders = await prisma.order.findMany({
    where: {
      affiliateId: { not: null },
      status: "delivered",
      deliveredAt: { lte: eligibleBefore },
      deletedAt: null,
    },
    include: {
      affiliate: {
        include: {
          user: { select: { email: true, displayName: true } },
          tier: true,
        },
      },
    },
    orderBy: { deliveredAt: "asc" },
  });

  const rows = [
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
      "attribution",
      "deliveredAt",
    ],
  ];

  for (const o of orders) {
    const tier = o.affiliate?.tier;
    const type = tier?.commissionType ?? "percent";
    const value = Number(tier?.commissionValue ?? 0);
    const orderTotalUsd = o.totalCents / 100;
    const commissionUsd = type === "fixed"
      ? value
      : Math.round(orderTotalUsd * (value / 100) * 100) / 100;
    rows.push([
      o.id,
      o.affiliateId ?? "",
      o.affiliatePid ?? "",
      o.affiliate?.user.displayName || "",
      o.affiliate?.user.email || "",
      tier?.name ?? "",
      type,
      value.toFixed(2),
      orderTotalUsd.toFixed(2),
      commissionUsd.toFixed(2),
      o.affiliateAttribution ?? "",
      o.deliveredAt ? o.deliveredAt.toISOString() : "",
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

