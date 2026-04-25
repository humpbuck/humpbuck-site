import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ordersWhere, parseOrdersFilter } from "@/lib/admin/order-filters";

export async function GET(req: Request) {
  await assertAdmin();

  const url = new URL(req.url);
  const filter = parseOrdersFilter(url.searchParams.get("filter") ?? undefined);
  const search = url.searchParams.get("q") ?? "";
  const dateFrom = url.searchParams.get("from") ?? "";
  const dateTo = url.searchParams.get("to") ?? "";

  const where = ordersWhere(filter, { search, dateFrom, dateTo });

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "Order ID",
    "Order Code",
    "Date",
    "Email",
    "Status",
    "Provider",
    "Total (USD)",
    "Carrier",
    "Tracking",
    "Traffic Source",
  ].join(",");

  const rows = orders.map((o) => {
    const cols = [
      o.id,
      o.merchantOrderCode ?? "",
      o.createdAt.toISOString().slice(0, 10),
      o.email,
      o.status,
      o.provider,
      (o.totalCents / 100).toFixed(2),
      o.carrier ?? "",
      o.trackingNumber ?? "",
      o.trafficSource,
    ];
    return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="humpbuck-orders-${date}.csv"`,
    },
  });
}
