import Link from "next/link";
import { assertAdmin } from "@/lib/admin-auth";

async function LogoutButton() {
  return (
    <form action="/api/admin/logout" method="post">
      <button
        type="submit"
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
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
          <p className="mt-1 text-xs text-muted">Orders & fulfillment</p>
        </div>
        <nav className="flex flex-wrap items-center gap-6">
          <Link
            href="/admin"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 hover:text-ink"
          >
            Overview
          </Link>
          <Link
            href="/admin/orders"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 hover:text-ink"
          >
            Orders
          </Link>
          <Link
            href="/"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
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
