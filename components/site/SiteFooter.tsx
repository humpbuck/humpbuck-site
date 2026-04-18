import Link from "next/link";

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
  return (
    <footer className="border-t border-[color:var(--color-line)] bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="font-serif text-2xl tracking-tight">HUMPBUCK</div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              DIGI-TEMP ana-digi flagship, RM-TONNEAU barrel-case line, and
              wholesale factory programs — clear products, clear checkout.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted">
              Secure payments · Global shipping · 24/7 support
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55">
                  {c.title}
                </div>
                <ul className="mt-4 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-ink/75 transition hover:text-ink"
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

        <div className="mt-12 flex flex-col gap-3 border-t border-[color:var(--color-line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted">
            © {new Date().getFullYear()} HUMPBUCK. Demo storefront UI.
          </p>
          <p className="text-[12px] text-muted">
            Replace copy, pricing, and policies before launch.
          </p>
        </div>
      </div>
    </footer>
  );
}
