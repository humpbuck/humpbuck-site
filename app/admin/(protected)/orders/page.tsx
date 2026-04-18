import Link from "next/link";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import {
  ordersListPath,
  ordersWhere,
  parseOrdersFilter,
} from "@/lib/admin/order-filters";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = parseOrdersFilter(sp.filter);
  const where = ordersWhere(filter);

  const rawPage = Math.max(1, Math.floor(Number(sp.page) || 1));

  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(rawPage, totalPages);
  const skip = (page - 1) * PAGE_SIZE;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const rows = orders.map((o) => ({
    id: o.id,
    email: o.email,
    status: o.status,
    totalCents: o.totalCents,
    trackingNumber: o.trackingNumber,
    provider: o.provider,
    trafficSource: o.trafficSource,
    createdAt: o.createdAt.toISOString(),
  }));

  const filterHint =
    filter === "completed"
      ? "Completed (status: Shipped)"
      : filter === "unshipped"
        ? "Unshipped (status: Paid or Processing)"
        : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-muted">
            Manage fulfillment, tracking, and status. Click an order to open
            details. Delete from the row or select multiple and use the bulk
            bar.
          </p>
          {filterHint && (
            <p className="mt-2 text-sm text-ink/80">
              Showing: <span className="font-medium">{filterHint}</span>
              {" · "}
              <Link
                href="/admin/orders"
                className="font-semibold text-sky-800 underline-offset-2 hover:underline"
              >
                Clear filter
              </Link>
            </p>
          )}
        </div>
        <p className="text-sm tabular-nums text-muted">
          {total} {total === 1 ? "order" : "orders"}
          {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-10 text-sm text-muted">
          {filter === "all"
            ? "No orders yet."
            : "No orders match this filter."}{" "}
          {filter !== "all" && (
            <Link
              href="/admin/orders"
              className="font-medium text-sky-800 underline-offset-2 hover:underline"
            >
              View all orders
            </Link>
          )}
        </p>
      ) : (
        <>
          <div className="mt-8">
            <AdminOrdersTable rows={rows} />
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-6 flex flex-wrap items-center justify-end gap-3 text-sm"
              aria-label="Pagination"
            >
              {prevPage ? (
                <Link
                  href={ordersListPath(prevPage, filter)}
                  className="rounded-xl border border-line px-4 py-2 font-semibold uppercase tracking-widest text-ink hover:bg-white/80"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-xl border border-line/50 px-4 py-2 text-muted opacity-60">
                  Previous
                </span>
              )}
              <span className="tabular-nums text-muted">
                {page} / {totalPages}
              </span>
              {nextPage ? (
                <Link
                  href={ordersListPath(nextPage, filter)}
                  className="rounded-xl border border-line px-4 py-2 font-semibold uppercase tracking-widest text-ink hover:bg-white/80"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-xl border border-line/50 px-4 py-2 text-muted opacity-60">
                  Next
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
