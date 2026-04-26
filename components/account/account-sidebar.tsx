"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/payment-methods", label: "Payment methods" },
  { href: "/account/affiliate", label: "Affiliate" },
  { href: "/account/details", label: "Account details" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-[color:var(--color-line)] pb-6 lg:w-56 lg:flex-col lg:flex-nowrap lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8"
      aria-label="Account"
    >
      <p className="hidden w-full text-[10px] font-semibold uppercase tracking-[0.2em] text-muted lg:mb-3 lg:block">
        My account
      </p>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition lg:w-full ${
            isActive(href, pathname)
              ? "bg-ink text-paper"
              : "text-ink/75 hover:bg-ink/[0.04] hover:text-ink"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
