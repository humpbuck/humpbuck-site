"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const NAV_LINKS = [
  { href: "/account", msgKey: "navOverview" as const },
  { href: "/account/orders", msgKey: "navOrders" as const },
  { href: "/account/addresses", msgKey: "navAddresses" as const },
  { href: "/account/subscribe", msgKey: "navSubscribe" as const },
  { href: "/account/affiliate", msgKey: "navAffiliate" as const },
  { href: "/account/details", msgKey: "navDetails" as const },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Account");

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-line pb-6 lg:w-56 lg:flex-col lg:flex-nowrap lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8"
      aria-label={t("navAriaLabel")}
    >
      <p className="hidden w-full text-[10px] font-semibold uppercase tracking-[0.2em] text-muted lg:mb-3 lg:block">
        {t("navHeading")}
      </p>
      {NAV_LINKS.map(({ href, msgKey }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition lg:w-full ${
            isActive(href, pathname)
              ? "bg-ink text-paper"
              : "text-ink/75 hover:bg-ink/4 hover:text-ink"
          }`}
        >
          {t(msgKey)}
        </Link>
      ))}
    </nav>
  );
}
