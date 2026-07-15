import Link from "next/link";
import { Mail } from "lucide-react";
import {
  ADMIN_INBOX_CATEGORY,
  adminInboxCategoryLabel,
  syncSystemInboxMessages,
} from "@/lib/admin-inbox";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";

function LogoutButton() {
  return (
    <form action="/api/admin/logout" method="post" className="m-0 inline-flex shrink-0 p-0">
      <button
        type="submit"
        className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-muted hover:text-ink"
      >
        SIGN OUT
      </button>
    </form>
  );
}

const NAV_LINK_CLASS =
  "inline-flex shrink-0 items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertAdmin();
  await syncSystemInboxMessages();
  const [
    pendingOrderCount,
    pendingSubscribeCount,
    pendingMockupRequestCount,
    pendingContactCount,
    pendingProductReviewCount,
  ] = await Promise.all([
    prisma.adminInboxMessage.count({
      where: { category: ADMIN_INBOX_CATEGORY.order, status: "pending" },
    }).catch(() => 0),
    prisma.adminInboxMessage.count({
      where: { category: ADMIN_INBOX_CATEGORY.subscribe, status: "pending" },
    }).catch(() => 0),
    prisma.adminInboxMessage.count({
      where: { category: ADMIN_INBOX_CATEGORY.emailMockupRequest, status: "pending" },
    }).catch(() => 0),
    prisma.adminInboxMessage.count({
      where: { category: ADMIN_INBOX_CATEGORY.contactSupport, status: "pending" },
    }).catch(() => 0),
    prisma.productReview.count({ where: { status: "pending" } }).catch(() => 0),
  ]);
  const totalPendingInboxCount =
    pendingOrderCount +
    pendingSubscribeCount +
    pendingMockupRequestCount +
    pendingContactCount +
    pendingProductReviewCount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="border-b border-line pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xl tracking-tight">HUMPBUCK Admin</p>
            <p className="mt-1 text-xs text-muted">Orders, reviews & fulfillment</p>
          </div>

          <div className="group relative shrink-0">
            <Link
              href={adminPath("/messages")}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink/80 transition hover:border-ink/20 hover:text-ink"
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
            <div className="pointer-events-none absolute right-0 top-11 z-20 hidden w-64 rounded-xl border border-line bg-white p-3 text-xs text-ink shadow-md group-hover:pointer-events-auto group-hover:block">
              <p className="font-semibold text-ink">Pending messages</p>
              <p className="mt-1 text-muted">Hover summary by category</p>
              <ul className="mt-2 space-y-1 text-ink/90">
                <li>{adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.order)}: {pendingOrderCount}</li>
                <li>{adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.subscribe)}: {pendingSubscribeCount}</li>
                <li>
                  {adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.emailMockupRequest)}: {pendingMockupRequestCount}
                </li>
                <li>
                  {adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.contactSupport)}: {pendingContactCount}
                </li>
                <li>
                  {adminInboxCategoryLabel(ADMIN_INBOX_CATEGORY.productReview)}: {pendingProductReviewCount}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <nav className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:gap-x-6">
            <Link href={adminPath()} className={NAV_LINK_CLASS}>
              OVERVIEW
            </Link>
            <Link href={adminPath("/analytics")} className={NAV_LINK_CLASS}>
              ANALYTICS
            </Link>
            <Link href={adminPath("/orders")} className={NAV_LINK_CLASS}>
              ORDERS
            </Link>
            <Link href={adminPath("/inventory")} className={NAV_LINK_CLASS}>
              PRODUCTS
            </Link>
            <Link href={adminPath("/coupons")} className={NAV_LINK_CLASS}>
              COUPONS
            </Link>
            <Link href={adminPath("/shipping-fees")} className={NAV_LINK_CLASS}>
              SHIPPING FEE
            </Link>
            <Link href={adminPath("/blog")} className={NAV_LINK_CLASS}>
              BLOG
            </Link>
            <Link href={adminPath("/announcement")} className={NAV_LINK_CLASS}>
              ANNOUNCEMENT
            </Link>
            <Link href={adminPath("/homepage")} className={NAV_LINK_CLASS}>
              HOMEPAGE
            </Link>
            <Link href={adminPath("/about")} className={NAV_LINK_CLASS}>
              ABOUT
            </Link>
            <Link href={adminPath("/reviews")} className={NAV_LINK_CLASS}>
              REVIEWS
            </Link>
            <Link href={adminPath("/customers")} className={NAV_LINK_CLASS}>
              CUSTOMERS
            </Link>
            <Link
              href="https://www.humpbuck.com/"
              className={NAV_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer"
            >
              VIEW SITE
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <div className="py-10">{children}</div>
    </div>
  );
}
