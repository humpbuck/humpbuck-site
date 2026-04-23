import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { getProductsBySeries, getSeriesBySlug, seriesList } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/seo";

export async function generateStaticParams() {
  return seriesList.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getSeriesBySlug(slug);
  if (!s) return { title: "Series" };
  const path = `/series/${encodeURIComponent(slug)}`;
  return {
    title: s.name,
    description: s.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: `${getSiteUrl()}${path}`,
      title: `${s.name} · HUMPBUCK`,
      description: s.description,
    },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const items = getProductsBySeries(series.slug);

  const heroClass =
    series.theme === "digital"
      ? "bg-[#070a10] text-white"
      : series.theme === "luxe"
        ? "bg-[#141210] text-white"
        : "bg-gradient-to-br from-[#151025] to-[#0f1114] text-white";

  return (
    <div>
      <section className={`relative overflow-hidden border-b border-white/10 ${heroClass}`}>
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <Image
            src={series.heroImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Series
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight sm:text-6xl">
            {series.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{series.tagline}</p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/70">
            {series.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/shop?series=${series.slug}`}
              className="inline-flex rounded-full bg-white px-7 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0f1114] transition hover:bg-white/90"
            >
              Shop this series
            </Link>
            <Link
              href="/wholesale"
              className="inline-flex rounded-full border border-white/20 bg-white/5 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
            >
              Wholesale
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <h2 className="font-serif text-2xl">Models</h2>
        <p className="mt-2 text-sm text-muted">
          {items.length} {items.length === 1 ? "piece" : "pieces"} in this series.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
