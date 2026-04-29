import Link from "next/link";
import { ChevronDown, Mail } from "lucide-react";
import {
  ADMIN_INBOX_CATEGORY,
  adminInboxCategoryLabel,
  syncSystemInboxMessages,
} from "@/lib/admin-inbox";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

async function LogoutButton({ inMenu = false }: { inMenu?: boolean }) {
  const navItemClass = inMenu
    ? "block w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 hover:bg-paper hover:text-ink"
    : "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink";
  return (
    <form
      action="/api/admin/logout"
      method="post"
      className={inMenu ? "m-0 block p-0" : "m-0 inline-flex shrink-0 items-center p-0 align-middle"}
    >
      <button
        type="submit"
        className={`${navItemClass} cursor-pointer border-0 bg-transparent p-0 align-middle leading-none`}
      >
        Sign out
      </button>
    </form>
  );
}

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertAdmin();
  await syncSystemInboxMessages();
  const [
    pendingCouponRequestCount,
    pendingOrderCount,
    pendingSubscribeCount,
    pendingMockupRequestCount,
  ] = await Promise.all([
    prisma.affiliateCouponRequest
      .count({
        where: { status: "pending" },
      })
      .catch(() => 0),
    prisma.adminInboxMessage
      .count({
        where: { category: ADMIN_INBOX_CATEGORY.order, status: "pending" },
      })
      .catch(() => 0),
    prisma.adminInboxMessage
      .count({
        where: {
          category: ADMIN_INBOX_CATEGORY.subscribe,
          status: "pending",
        },
      })
      .catch(() => 0),
    prisma.adminInboxMessage
      .count({
        where: {
          category: ADMIN_INBOX_CATEGORY.emailMockupRequest,
          status: "pending",
        },
      })
      .catch(() => 0),
  ]);
  const totalPendingInboxCount =
    pendingOrderCount +
    pendingCouponRequestCount +
    pendingSubscribeCount +
    pendingMockupRequestCount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-serif text-xl tracking-tight">HUMPBUCK Admin</p>
          <p className="mt-1 text-xs text-muted">Orders, reviews & fulfillment</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href={adminPath()}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Overview
          </Link>
          <Link
            href={adminPath("/orders")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Orders
          </Link>
          <Link
            href={adminPath("/reviews")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Reviews
          </Link>
          <Link
            href={adminPath("/inventory")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Products & Inventory
          </Link>
          <Link
            href={adminPath("/customers")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Customers
          </Link>
          <Link
            href={adminPath("/traffic")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Traffic
          </Link>
          <Link
            href={adminPath("/coupons")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Coupons
          </Link>
          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-muted hover:text-ink"
            >
              More
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="pointer-events-none absolute right-0 top-6 z-20 hidden min-w-44 rounded-xl border border-line bg-white p-2 text-xs text-ink shadow-md group-hover:pointer-events-auto group-hover:block">
              <Link
                href={adminPath("/affiliate")}
                className="block rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 hover:bg-paper hover:text-ink"
              >
                Affiliate
              </Link>
              <Link
                href={adminPath("/video-tutorial")}
                className="block rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 hover:bg-paper hover:text-ink"
              >
                Video tutorial
              </Link>
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 hover:bg-paper hover:text-ink"
              >
                View site
              </Link>
              <div className="mt-1 border-t border-line pt-1">
                <LogoutButton inMenu />
              </div>
            </div>
          </div>
          <div className="group relative">
            <Link
              href={adminPath("/messages")}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink/80 transition hover:border-ink/20 hover:text-ink"
              aria-label={`Message inbox ${totalPendingInboxCount} pending`}
              title="Message inbox"
            >
              <Mail className="h-4 w-4" />
              {totalPendingInboxCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[9px] font-bold leading-4 text-white">
                  {totalPendingInboxCount}
                </span>
              ) : null}
            </Link>
            <div className="pointer-events-none absolute right-0 top-10 z-20 hidden w-64 rounded-xl border border-line bg-white p-3 text-xs text-ink shadow-md group-hover:block">
              <p className="font-semibold text-ink">Pending messages</p>
              <p className="mt-1 text-muted">Hover summary by category</p>
              <ul className="mt-2 space-y-1 text-ink/90">
                <li>{adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.order)}: {pendingOrderCount}</li>
                <li>{adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.affiliates)}: {pendingCouponRequestCount}</li>
                <li>{adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.subscribe)}: {pendingSubscribeCount}</li>
                <li>
                  {adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.emailMockupRequest)}:{" "}
                  {pendingMockupRequestCount}
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>
      <div className="py-10">{children}</div>
    </div>
  );
}
