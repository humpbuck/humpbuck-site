import Link from "next/link";

export const metadata = {
  title: "About — DIGI-TEMP, RM-TONNEAU & RD-ASTRAL",
  description:
    "How HUMPBUCK structures DIGI-TEMP (ana-digi flagship) alongside RM-TONNEAU and RD-ASTRAL — design intent and multi-series SEO hygiene.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Brand
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
        HUMPBUCK — utility first, then spectacle.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">
        We run a direct storefront plus factory programs so a single launch can grow
        into repeatable production without re-sourcing every season.
      </p>

      <div className="mt-12 space-y-8 text-sm leading-relaxed text-ink/85">
        <section>
          <h2 className="font-serif text-2xl text-ink">DIGI-TEMP (flagship)</h2>
          <p className="mt-3 text-muted">
            <strong className="text-ink">HUMPBUCK DIGI-TEMP</strong> is our lead
            ana-digi line: dual LCD legibility, modes for TIME, DATE, alarm, outdoor
            temperature (OUT), and stopwatch (STW), in stainless cases suited to daily
            wear. It is the series we emphasize in storytelling, metadata, and
            merchandising — the name customers should remember first.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink">RM-TONNEAU (parallel line)</h2>
          <p className="mt-3 text-muted">
            <strong className="text-ink">RM-TONNEAU</strong> is a separate barrel-case
            and skeleton-forward quartz collection. It does not replace DIGI-TEMP; it
            extends the catalog for buyers who want a different silhouette and keyword
            set. Each line has its own URL (/series/digitemp vs /series/tonneau), title
            tags, and copy — so search engines and ads can target them cleanly without
            mixing messages.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink">What we optimize for</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>Readable specs (dimensions, WR, modes) on every product page</li>
            <li>Clear checkout, tax, and after-sales pages</li>
            <li>Wholesale briefs with MOQ and sampling checkpoints</li>
          </ul>
        </section>
      </div>

      <div className="mt-12 rounded-3xl border border-[color:var(--color-line)] bg-white/70 p-8">
        <p className="text-sm text-muted">
          Add your founding story, manufacturing geography, warranty policy, and
          sustainability commitments here when ready.
        </p>
        <Link
          href="/wholesale"
          className="mt-5 inline-flex text-[12px] font-semibold uppercase tracking-[0.14em] text-ink underline-offset-8 hover:underline"
        >
          Explore wholesale
        </Link>
      </div>
    </div>
  );
}
