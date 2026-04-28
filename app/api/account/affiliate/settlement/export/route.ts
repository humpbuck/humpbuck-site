import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SettlementFilter = "all" | "pending" | "eligible" | "paid" | "reversed";

function normalizeSettlementFilter(raw: string | null): SettlementFilter {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "pending" || v === "eligible" || v === "paid" || v === "reversed") {
    return v;
  }
  return "all";
}

function normalizeDateInput(raw: string | null): string {
  const v = String(raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, "\"\"")}"`;
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const settlementFilter = normalizeSettlementFilter(url.searchParams.get("settlement"));
  const dateFromInput = normalizeDateInput(url.searchParams.get("from"));
  const dateToInput = normalizeDateInput(url.searchParams.get("to"));
  const dateFrom = dateFromInput ? new Date(`${dateFromInput}T00:00:00`) : null;
  const dateTo = dateToInput ? new Date(`${dateToInput}T23:59:59.999`) : null;
  const eligibleAtWhere =
    dateFrom && dateTo
      ? dateFrom <= dateTo
        ? { gte: dateFrom, lte: dateTo }
        : { gte: dateTo, lte: dateFrom }
      : dateFrom
        ? { gte: dateFrom }
        : dateTo
          ? { lte: dateTo }
          : undefined;

  const rows = await prisma.affiliateCommissionLedger.findMany({
    where: {
      affiliate: { userId },
      order: { deletedAt: null },
      ...(settlementFilter === "all" ? {} : { status: settlementFilter }),
      ...(eligibleAtWhere ? { eligibleAt: eligibleAtWhere } : {}),
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          totalCents: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "order_id",
    "order_status",
    "settlement_status",
    "eligible_at",
    "paid_at",
    "reversed_at",
    "commission_usd",
    "order_total_usd",
  ];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        csvCell(row.order.id),
        csvCell(row.order.status),
        csvCell(row.status),
        csvCell(row.eligibleAt.toISOString()),
        csvCell(row.paidAt?.toISOString() ?? ""),
        csvCell(row.reversedAt?.toISOString() ?? ""),
        csvCell((row.commissionCents / 100).toFixed(2)),
        csvCell((row.order.totalCents / 100).toFixed(2)),
      ].join(","),
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `affiliate-settlement-${stamp}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      "Cache-Control": "no-store",
    },
  });
}
