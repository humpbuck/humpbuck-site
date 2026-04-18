import type { Prisma } from "@prisma/client";

export type AdminOrdersFilter = "all" | "completed" | "unshipped";

export function parseOrdersFilter(
  raw: string | string[] | undefined,
): AdminOrdersFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "completed" || v === "unshipped") return v;
  return "all";
}

export function ordersWhere(
  filter: AdminOrdersFilter,
): Prisma.OrderWhereInput {
  if (filter === "completed") return { status: "shipped" };
  if (filter === "unshipped") {
    return { status: { in: ["paid", "processing"] } };
  }
  return {};
}

export function ordersListPath(page: number, filter: AdminOrdersFilter): string {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("filter", filter);
  if (page > 1) p.set("page", String(page));
  const q = p.toString();
  return q ? `/admin/orders?${q}` : "/admin/orders";
}
