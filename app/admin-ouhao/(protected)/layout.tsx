import Link from "next/link";
import { assertAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

async function LogoutButton() {
  const navItemClass =
    "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink";
  return (
    <form
      action="/api/admin/logout"
      method="post"
      className="m-0 inline-flex shrink-0 items-center p-0 align-middle"
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
            Inventory
          </Link>
          <Link
            href={adminPath("/customers")}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink"
          >
            Customers
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-muted hover:text-ink"
          >
            View site
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <div className="py-10">{children}</div>
    </div>
  );
}
