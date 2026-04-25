import Link from "next/link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminHomePage() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day7 = new Date(today.getTime() - 7 * 86400000);
  const day30 = new Date(today.getTime() - 30 * 86400000);

  const paidStatuses = ["paid", "processing", "shipped"];

  const [
    total,
    completed,
    unshipped,
    reviewCount,
    revenueAll,
    revenue7d,
    revenue30d,
    revenueToday,
    lowStockItems,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { status: "shipped", deletedAt: null } }),
    prisma.order.count({
      where: { status: { in: ["paid", "processing"] }, deletedAt: null },
    }),
    prisma.productReview.count(),
    // Total revenue (all paid orders)
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: paidStatuses }, deletedAt: null },
    }),
    // 7-day revenue
    prisma.order.aggregate({
      _sum: { totalCents: true },
      _count: true,
      where: {
        status: { in: paidStatuses },
        createdAt: { gte: day7 },
        deletedAt: null,
      },
    }),
    // 30-day revenue
    prisma.order.aggregate({
      _sum: { totalCents: true },
      _count: true,
      where: {
        status: { in: paidStatuses },
        createdAt: { gte: day30 },
        deletedAt: null,
      },
    }),
    // Today revenue
    prisma.order.aggregate({
      _sum: { totalCents: true },
      _count: true,
      where: {
        status: { in: paidStatuses },
        createdAt: { gte: today },
        deletedAt: null,
      },
    }),
    // Low stock items
    prisma.productInventory.findMany({
      where: { quantity: { lte: 10 } },
      orderBy: { quantity: "asc" },
      take: 10,
    }),
    // Recent 5 orders
    prisma.order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        status: true,
        totalCents: true,
        provider: true,
        createdAt: true,
        merchantOrderCode: true,
      },
    }),
  ]);

  const numLink =
    "mt-2 inline-block rounded-lg font-serif text-3xl tabular-nums text-ink outline-none ring-ink/0 transition hover:text-ink/75 hover:underline focus-visible:ring-2 focus-visible:ring-ink/20";

  const lowStockCount = lowStockItems.filter(
    (i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold,
  ).length;
  const outOfStockCount = lowStockItems.filter((i) => i.quantity === 0).length;

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight">Overview</h1>
      <p className="mt-2 text-sm text-muted">
        Quick stats from your database (all payment providers).
      </p>

      {/* Revenue cards */}
      <div className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Revenue
        </h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Today
            </p>
            <p className="mt-2 font-serif text-2xl tabular-nums text-ink">
              {formatUsd(revenueToday._sum.totalCents ?? 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {revenueToday._count} order{revenueToday._count !== 1 ? "s" : ""}
            </p>
          </li>
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Last 7 days
            </p>
            <p className="mt-2 font-serif text-2xl tabular-nums text-ink">
              {formatUsd(revenue7d._sum.totalCents ?? 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {revenue7d._count} order{revenue7d._count !== 1 ? "s" : ""}
            </p>
          </li>
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Last 30 days
            </p>
            <p className="mt-2 font-serif text-2xl tabular-nums text-ink">
              {formatUsd(revenue30d._sum.totalCents ?? 0)}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {revenue30d._count} order{revenue30d._count !== 1 ? "s" : ""}
            </p>
          </li>
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              All time
            </p>
            <p className="mt-2 font-serif text-2xl tabular-nums text-ink">
              {formatUsd(revenueAll._sum.totalCents ?? 0)}
            </p>
          </li>
        </ul>
      </div>

      {/* Order stats */}
      <div className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Orders
        </h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Total orders
            </p>
            <Link
              href={adminPath("/orders")}
              className={numLink}
              aria-label={`View all ${total} orders`}
            >
              {total}
            </Link>
          </li>
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Completed
            </p>
            <Link
              href={`${adminPath("/orders")}?filter=completed`}
              className={numLink}
              aria-label={`View ${completed} completed orders`}
            >
              {completed}
            </Link>
            <p className="mt-1 text-[10px] text-muted">Status: Shipped</p>
          </li>
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Unshipped
            </p>
            <Link
              href={`${adminPath("/orders")}?filter=unshipped`}
              className={numLink}
              aria-label={`View ${unshipped} unshipped orders`}
            >
              {unshipped}
            </Link>
            <p className="mt-1 text-[10px] text-muted">Paid or processing</p>
          </li>
          <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Buyer reviews
            </p>
            <Link
              href={adminPath("/reviews")}
              className={numLink}
              aria-label={`Manage ${reviewCount} buyer reviews`}
            >
              {reviewCount}
            </Link>
          </li>
        </ul>
      </div>

      {/* Inventory alerts */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Inventory alerts
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {outOfStockCount > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                    {outOfStockCount} out of stock
                  </span>
                )}
                {lowStockCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {lowStockCount} low stock
                  </span>
                )}
              </div>
            </div>
            <Link
              href={adminPath("/inventory")}
              className="rounded-xl border border-amber-300 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-800 transition hover:bg-white"
            >
              Manage inventory
            </Link>
          </div>
        </div>
      )}

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Recent orders
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-line/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={adminPath(`/orders/${o.id}`)}
                        className="font-medium text-sky-800 underline-offset-2 hover:underline"
                      >
                        {o.merchantOrderCode || o.id.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{o.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold capitalize">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatUsd(o.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {o.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={adminPath("/orders")}
          className="inline-flex rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          View all orders
        </Link>
        <Link
          href={adminPath("/inventory")}
          className="inline-flex rounded-2xl border border-line bg-white/70 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
        >
          Manage inventory
        </Link>
        <Link
          href={adminPath("/reviews")}
          className="inline-flex rounded-2xl border border-line bg-white/70 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
        >
          Manage reviews
        </Link>
        <Link
          href={adminPath("/customers")}
          className="inline-flex rounded-2xl border border-line bg-white/70 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
        >
          Customers
        </Link>
      </div>
    </div>
  );
}
