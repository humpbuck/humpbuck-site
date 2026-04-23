import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [total, completed, unshipped, reviewCount] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "shipped" } }),
    prisma.order.count({
      where: { status: { in: ["paid", "processing"] } },
    }),
    prisma.productReview.count(),
  ]);

  const numLink =
    "mt-2 inline-block rounded-lg font-serif text-3xl tabular-nums text-ink outline-none ring-ink/0 transition hover:text-ink/75 hover:underline focus-visible:ring-2 focus-visible:ring-ink/20";

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight">Overview</h1>
      <p className="mt-2 text-sm text-muted">
        Quick stats from your database (all payment providers).
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Total orders
          </p>
          <Link
            href="/admin/orders"
            className={numLink}
            aria-label={`View all ${total} orders`}
          >
            {total}
          </Link>
        </li>
        <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Completed orders
          </p>
          <Link
            href="/admin/orders?filter=completed"
            className={numLink}
            aria-label={`View ${completed} completed orders`}
          >
            {completed}
          </Link>
          <p className="mt-1 text-[10px] text-muted">Status: Shipped</p>
        </li>
        <li className="rounded-2xl border border-line bg-white/60 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Unshipped orders
          </p>
          <Link
            href="/admin/orders?filter=unshipped"
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
            href="/admin/reviews"
            className={numLink}
            aria-label={`Manage ${reviewCount} buyer reviews`}
          >
            {reviewCount}
          </Link>
          <p className="mt-1 text-[10px] text-muted">Published on PDP</p>
        </li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          View all orders
        </Link>
        <Link
          href="/admin/reviews"
          className="inline-flex rounded-2xl border border-line bg-white/70 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20"
        >
          Manage reviews
        </Link>
      </div>
    </div>
  );
}
