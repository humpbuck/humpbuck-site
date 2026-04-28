import Link from "next/link";

export const metadata = {
  title: "Affiliates — Partner with HUMPBUCK",
  description:
    "Learn how to join the HUMPBUCK affiliate program, how commissions work, and what your affiliate dashboard includes.",
  alternates: {
    canonical: "/affiliates",
  },
};

export default function AffiliatesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <header className="border-b border-line pb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          Partnership
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl tracking-tight sm:text-5xl">
          Become a HUMPBUCK affiliate
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
          If you create content, review watches, or run traffic channels, you can
          apply to partner with HUMPBUCK and earn commission on attributed orders.
        </p>
      </header>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <article className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card)">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Step 1
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">Register account</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Create a buyer account first, then open your affiliate page in My
            Account and submit your partner info.
          </p>
        </article>

        <article className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card)">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Step 2
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">Generate links</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            After approval, use your PID link generator. Buyers can land on one
            product and purchase another product; attribution still applies within
            the valid window.
          </p>
        </article>

        <article className="rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card)">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Step 3
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">Track settlements</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            In your affiliate dashboard, you can filter settlement orders by
            status, date range, and export CSV for reconciliation.
          </p>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-line bg-paper p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-ink">Policy summary</h2>
        <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Attribution is valid for 7 days from affiliate link visit, using
            last-touch logic in that window.
          </li>
          <li>
            Self-purchase is excluded. Affiliates do not earn commission from
            their own orders.
          </li>
          <li>
            Refunded orders do not generate commission, and affiliate attribution
            is removed automatically on refunded orders.
          </li>
          <li>
            Settlement starts after delivery confirmation, with a 30-day hold
            period before commission becomes eligible for payout.
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-3xl border border-line bg-white/70 p-6 shadow-(--shadow-card) sm:p-8">
        <h2 className="font-serif text-2xl text-ink">Affiliate dashboard at a glance</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              Application & profile
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Submit your application, set payout details, and keep contact info
              updated.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              Link generator
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Build and copy product links with your PID for campaigns, social,
              and creator content.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              Settlement orders
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Review order-level commission status: pending, eligible, paid, and
              reversed, with filters and pagination.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
              Export & reconciliation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Export filtered settlement rows to CSV for finance tracking and
              monthly reporting.
            </p>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/account/affiliate"
            className="inline-flex items-center rounded-xl bg-luxe px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-luxe/90"
          >
            Go to affiliate center
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-xl border border-line bg-paper px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/85 transition hover:border-ink/20 hover:bg-white"
          >
            Learn about HUMPBUCK
          </Link>
        </div>
      </section>
    </div>
  );
}
