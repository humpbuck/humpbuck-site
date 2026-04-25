import Link from "next/link";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.q?.trim() || "";
  const PAGE_SIZE = 20;
  const rawPage = Math.max(1, Math.floor(Number(sp.page) || 1));

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(rawPage, totalPages);
  const skip = (page - 1) * PAGE_SIZE;

  const users = await prisma.user.findMany({
    where,
    orderBy: { id: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      displayName: true,
      image: true,
      _count: { select: { orders: true, productReviews: true } },
    },
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (search) params.set("q", search);
    const qs = params.toString();
    return qs ? `${adminPath("/customers")}?${qs}` : adminPath("/customers");
  }

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Customers</h1>
          <p className="mt-2 text-sm text-muted">
            Registered users and their order history.
          </p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          {total} customer{total !== 1 ? "s" : ""}
          {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
        </p>
      </div>

      {/* Search */}
      <form method="get" className="mt-6 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search by email or name..."
          className="flex-1 min-w-[200px] rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/30"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-paper transition hover:bg-ink/90"
        >
          Search
        </button>
        {search && (
          <Link
            href={adminPath("/customers")}
            className="rounded-lg border border-line bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink transition hover:border-ink/20"
          >
            Clear
          </Link>
        )}
      </form>

      {total === 0 ? (
        <p className="mt-10 text-sm text-muted">
          {search ? "No customers match your search." : "No registered customers yet."}
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const displayName =
                    u.displayName ||
                    u.name ||
                    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                    "—";
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-line/50 last:border-0 hover:bg-white/40"
                    >
                      <td className="px-4 py-3 font-medium">{displayName}</td>
                      <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {u._count.orders}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {u._count.productReviews}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-6 flex flex-wrap items-center justify-end gap-3 text-sm"
              aria-label="Pagination"
            >
              {prevPage ? (
                <Link
                  href={pageUrl(prevPage)}
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
                  href={pageUrl(nextPage)}
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
