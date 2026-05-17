import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountOverviewPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [orderCount, user] = await Promise.all([
    prisma.order.count({
      where: { userId, deletedAt: null },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    }),
  ]);

  const greeting =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Overview
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">My account</h1>
      <p className="mt-4 text-sm text-muted">
        Hello, <span className="font-medium text-ink/90">{greeting}</span>. Manage
        your orders, addresses, affiliate tools, and profile from here.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-2xl border border-line bg-white/60 p-5 transition hover:border-ink/15 hover:shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Orders
          </p>
          <p className="mt-2 font-medium text-ink">
            {orderCount === 0
              ? "No orders yet"
              : `${orderCount} order${orderCount === 1 ? "" : "s"} on file`}
          </p>
        </Link>
        <Link
          href="/account/details"
          className="rounded-2xl border border-line bg-white/60 p-5 transition hover:border-ink/15 hover:shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Profile
          </p>
          <p className="mt-2 text-sm text-muted">Name, email, password</p>
        </Link>
      </div>

      <p className="mt-10">
        <Link
          href="/shop"
          className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/70 underline-offset-4 hover:text-ink hover:underline"
        >
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
