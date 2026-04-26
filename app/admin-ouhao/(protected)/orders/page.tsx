import Link from "next/link";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import {
  ordersListPath,
  ordersWhere,
  parseOrdersFilter,
} from "@/lib/admin/order-filters";
import { OrderSearchBar } from "@/components/admin/order-search-bar";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const filter = parseOrdersFilter(sp.filter);
  const search = sp.q?.trim() || "";
  const dateFrom = sp.from || "";
  const dateTo = sp.to || "";
  const where = ordersWhere(filter, { search, dateFrom, dateTo });

  const rawPage = Math.max(1, Math.floor(Number(sp.page) || 1));

  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(rawPage, totalPages);
  const skip = (page - 1) * PAGE_SIZE;

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
    merchantOrderCode: o.merchantOrderCode,
  }));

  const FILTER_LABELS: Record<string, string> = {
    completed: "Completed (Shipped / Delivered)",
    unshipped: "Unshipped (Paid / Processing)",
    cancelled: "Cancelled",
    refunded: "Refunded",
    pending: "Pending payment",
  };

  const filterHint = FILTER_LABELS[filter] ?? null;
  const hasActiveFilters = filter !== "all" || search || dateFrom || dateTo;

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-muted">
            Manage fulfillment, tracking, and status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`${adminPath("/orders")}/export?filter=${filter}&q=${encodeURIComponent(search)}&from=${dateFrom}&to=${dateTo}`}
            className="rounded-xl border border-line bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink transition hover:border-ink/20"
          >
            Export CSV
          </Link>
          <p className="text-sm tabular-nums text-muted">
            {total} {total === 1 ? "order" : "orders"}
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
          </p>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="mt-6">
        <OrderSearchBar
          currentFilter={filter}
          currentSearch={search}
          currentDateFrom={dateFrom}
          currentDateTo={dateTo}
        />
      </div>

      {filterHint && (
        <p className="mt-3 text-sm text-ink/80">
          Showing: <span className="font-medium">{filterHint}</span>
          {hasActiveFilters && (
            <>
              {" · "}
              <Link
                href={adminPath("/orders")}
                className="font-semibold text-sky-800 underline-offset-2 hover:underline"
              >
                Clear all filters
              </Link>
            </>
          )}
        </p>
      )}

      {total === 0 ? (
        <p className="mt-10 text-sm text-muted">
          {!hasActiveFilters
            ? "No orders yet."
            : "No orders match your filters."}{" "}
          {hasActiveFilters && (
            <Link
              href={adminPath("/orders")}
              className="font-medium text-sky-800 underline-offset-2 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </p>
      ) : (
        <>
          <div className="mt-6">
            <AdminOrdersTable rows={rows} />
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-6 flex flex-wrap items-center justify-end gap-3 text-sm"
              aria-label="Pagination"
            >
              {prevPage ? (
                <Link
                  href={ordersListPath(prevPage, filter, { search, dateFrom, dateTo })}
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
                  href={ordersListPath(nextPage, filter, { search, dateFrom, dateTo })}
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
