import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/site/ProductCard";
import { getSeriesBySlug, seriesList } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getShopCardR2GalleryImage } from "@/lib/r2-card-image";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { applyStorefrontProductLocale, getLocalizedSeriesFields } from "@/lib/storefront-locale";

/** Same Postgres source as `/shop`; that route stays fresh via `searchParams`. Without this, series pages are SSG at build and can show "0 pieces" if the build-time DB was empty or unreachable. */
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    seriesList.map((s) => ({ locale, slug: s.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Series" });
  const s = getSeriesBySlug(slug);
  if (!s) return { title: t("metaFallbackTitle") };
  const messages = await getMessages({ locale });
  const localized = getLocalizedSeriesFields(s, locale, messages);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/series/${encodeURIComponent(slug)}`;
  const ogSuffix = t("ogTitleSuffix");
  return {
    title: localized.name,
    description: localized.description,
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages(`/series/${encodeURIComponent(slug)}`),
    },
    openGraph: {
      type: "website",
      url: `${getSiteUrl()}${path}`,
      title: `${localized.name} ${ogSuffix}`,
      description: localized.description,
    },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Series");
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const messages = await getMessages({ locale });
  const localizedSeries = getLocalizedSeriesFields(series, locale, messages);

  const all = await getMergedCatalogProducts();
  const items = all
    .filter((p) => p.seriesSlug === series.slug)
    .map((p) => applyStorefrontProductLocale(p, locale, messages));

  const cardImages = await Promise.all(
    items.map((p) => getShopCardR2GalleryImage(p.slug)),
  );

  const heroClass =
    series.theme === "digital"
      ? "bg-[#070a10] text-white"
      : series.theme === "luxe"
        ? "bg-[#141210] text-white"
        : "bg-linear-to-br from-[#151025] to-[#0f1114] text-white";

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
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/25" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
            {t("kicker")}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight sm:text-6xl">
            {localizedSeries.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{localizedSeries.tagline}</p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/70">
            {localizedSeries.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/shop?series=${series.slug}`}
              className="inline-flex rounded-full bg-white px-7 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0f1114] transition hover:bg-white/90"
            >
              {t("shopThisSeries")}
            </Link>
            <Link
              href="/wholesale"
              className="inline-flex rounded-full border border-white/20 bg-white/5 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
            >
              {t("wholesale")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <h2 className="font-serif text-2xl">{t("models")}</h2>
        <p className="mt-2 text-sm text-muted">
          {t("piecesInSeries", { count: items.length })}
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {items.map((p, i) => (
            <ProductCard
              key={p.slug}
              product={p}
              cardImageUrl={cardImages[i] ?? undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
