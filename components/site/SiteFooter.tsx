import Link from "next/link";

import { CookieSettingsLink } from "@/components/analytics/cookie-settings-link";
import { publicSupportEmail } from "@/lib/support-contact";

const cols = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "DIGI-TEMP", href: "/series/digitemp" },
      { label: "RM-TONNEAU", href: "/series/tonneau" },
      { label: "RD-ASTRAL", href: "/series/rd-astral" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Wholesale", href: "/wholesale" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Shipping & tax", href: "/shipping" },
      { label: "Refund policy", href: "/refund" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
] as const;

export function SiteFooter() {
  const supportMail = publicSupportEmail();

  return (
    <footer className="border-t border-[color:var(--color-line)] bg-paper">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:pb-14 md:pt-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_2fr] md:gap-10">
          <div className="min-w-0">
            <div className="font-serif text-2xl tracking-tight">HUMPBUCK</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted sm:mt-4">
              DIGI-TEMP ana-digi flagship, RM-TONNEAU barrel-case line, and
              wholesale factory programs — clear products, clear checkout.
            </p>
            <p className="mt-4 text-[11px] uppercase leading-snug tracking-[0.14em] text-muted sm:mt-6 sm:text-xs sm:tracking-[0.16em]">
              Secure payments · Global shipping · 24/7 support
            </p>
          </div>
          {/* Whole block centered when wider than max-w-2xl; per-column: title centered, links text-left */}
          <div className="flex w-full min-w-0 justify-center">
            <div className="grid w-full min-w-0 max-w-2xl grid-cols-3 gap-x-3 sm:gap-x-8">
              {cols.map((c) => (
                <div
                  key={c.title}
                  className="flex min-w-0 max-w-full flex-col items-center"
                >
                  <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/55 sm:text-[11px] sm:tracking-[0.18em]">
                    {c.title}
                  </div>
                  <ul className="mt-3 w-fit max-w-full space-y-2 text-left sm:mt-4">
                    {c.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="block break-words text-[12px] leading-snug text-ink/75 transition hover:text-ink sm:text-sm"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[color:var(--color-line)] pt-7 sm:mt-12 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:pt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-[12px] text-muted">
              © {new Date().getFullYear()} HUMPBUCK. All rights reserved.
            </p>
            <CookieSettingsLink />
          </div>
          <p className="text-[12px] leading-relaxed text-muted sm:max-w-xl sm:text-right">
            <span className="sm:hidden">
              Final prices & shipping at checkout. Policies under Support.{" "}
              <a
                href={`mailto:${supportMail}`}
                className="text-ink/80 underline underline-offset-2 transition hover:text-ink"
              >
                {supportMail}
              </a>
            </span>
            <span className="hidden sm:inline">
              Prices, taxes, and shipping are confirmed at checkout. For shipping,
              refunds, privacy, and terms, see Support above. Questions:{" "}
              <a
                href={`mailto:${supportMail}`}
                className="text-ink/80 underline underline-offset-2 transition hover:text-ink"
              >
                {supportMail}
              </a>
              .
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
