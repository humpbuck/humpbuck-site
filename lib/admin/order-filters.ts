import type { Prisma } from "@prisma/client";
import { adminPath } from "@/lib/admin-path";

export type AdminOrdersFilter = "all" | "completed" | "unshipped" | "cancelled" | "refunded" | "pending";

export function parseOrdersFilter(
  raw: string | string[] | undefined,
): AdminOrdersFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (
    v === "completed" ||
    v === "unshipped" ||
    v === "cancelled" ||
    v === "refunded" ||
    v === "pending"
  )
    return v;
  return "all";
}

export function ordersWhere(
  filter: AdminOrdersFilter,
  opts?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Prisma.OrderWhereInput {
  const conditions: Prisma.OrderWhereInput[] = [{ deletedAt: null }];

  // Status filter
  if (filter === "completed")
    conditions.push({ status: { in: ["shipped", "delivered"] } });
  else if (filter === "unshipped")
    conditions.push({ status: { in: ["paid", "processing"] } });
  else if (filter === "cancelled") conditions.push({ status: "cancelled" });
  else if (filter === "refunded") conditions.push({ status: "refunded" });
  else if (filter === "pending") conditions.push({ status: "pending_payment" });

  // Search (email, order code, tracking number, id)
  if (opts?.search?.trim()) {
    const q = opts.search.trim();
    conditions.push({
      OR: [
        // SQLite/D1: no `mode: "insensitive"` — LIKE is case-insensitive for ASCII.
        { email: { contains: q } },
        { merchantOrderCode: { contains: q } },
        { trackingNumber: { contains: q } },
        { id: { contains: q } },
      ],
    });
  }

  // Date range
  if (opts?.dateFrom) {
    const d = new Date(opts.dateFrom);
    if (!isNaN(d.getTime())) conditions.push({ createdAt: { gte: d } });
  }
  if (opts?.dateTo) {
    const d = new Date(opts.dateTo);
    if (!isNaN(d.getTime())) {
      // Include the entire "to" day
      d.setDate(d.getDate() + 1);
      conditions.push({ createdAt: { lt: d } });
    }
  }

  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

export function ordersListPath(
  page: number,
  filter: AdminOrdersFilter,
  opts?: { search?: string; dateFrom?: string; dateTo?: string },
): string {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("filter", filter);
  if (page > 1) p.set("page", String(page));
  if (opts?.search) p.set("q", opts.search);
  if (opts?.dateFrom) p.set("from", opts.dateFrom);
  if (opts?.dateTo) p.set("to", opts.dateTo);
  const q = p.toString();
  const base = adminPath("/orders");
  return q ? `${base}?${q}` : base;
}
