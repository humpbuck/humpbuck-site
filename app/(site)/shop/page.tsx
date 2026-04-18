import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import {
  getAllProducts,
  getSeriesBySlug,
  seriesList,
  type SeriesSlug,
} from "@/lib/catalog";

const slugOk = (s: string | undefined): s is SeriesSlug =>
  s === "digitemp" || s === "tonneau" || s === "rd-astral";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  const { series: seriesParam } = await searchParams;
  const active = slugOk(seriesParam) ? seriesParam : null;
  const all = getAllProducts();
  const list = active
    ? all.filter((p) => p.seriesSlug === active)
    : all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          Catalog
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">
          Shop — DIGI-TEMP &amp; full catalog
        </h1>
        <p className="mt-3 text-muted">
          Browse by collection: <strong className="font-medium text-ink/90">DIGI-TEMP</strong>{" "}
          (ana-digi flagship), <strong className="font-medium text-ink/90">RM-TONNEAU</strong>{" "}
          (tonneau quartz), and RD-ASTRAL. Filters sync to the URL for sharing.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <FilterPill href="/shop" active={active === null} label="All" />
        {seriesList.map((s) => (
          <FilterPill
            key={s.slug}
            href={`/shop?series=${s.slug}`}
            active={active === s.slug}
            label={s.name}
          />
        ))}
      </div>

      {active != null && (
        <p className="mt-6 text-sm text-muted">
          Showing{" "}
          <span className="font-semibold text-ink">
            {getSeriesBySlug(active)?.name}
          </span>{" "}
          ({list.length} {list.length === 1 ? "item" : "items"})
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          Nothing here yet.{" "}
          <Link href="/shop" className="underline underline-offset-4">
            Clear filter
          </Link>
        </p>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-[color:var(--color-line)] bg-white/60 text-ink/75 hover:border-ink/15 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
