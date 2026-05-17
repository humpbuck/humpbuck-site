import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import {
  getSeriesBySlug,
  seriesList,
  type SeriesSlug,
} from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getShopCardR2GalleryImage } from "@/lib/r2-card-image";
import { routing } from "@/i18n/routing";
import { applyStorefrontProductLocale, getLocalizedSeriesFields } from "@/lib/storefront-locale";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

const slugOk = (s: string | undefined): s is SeriesSlug =>
  s === "digitemp" || s === "tonneau" || s === "rd-astral";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shop" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${pathPrefix}/shop`,
      languages: storefrontHreflangLanguages("/shop"),
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ series?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const { series: seriesParam } = await searchParams;
  const active = slugOk(seriesParam) ? seriesParam : null;
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const list = (
    active ? all.filter((p) => p.seriesSlug === active) : all
  ).map((p) => applyStorefrontProductLocale(p, locale, messages));

  const cardImages = await Promise.all(
    list.map((p) => getShopCardR2GalleryImage(p.slug)),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted">{t("intro")}</p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <FilterPill href="/shop" active={active === null} label={t("filterAll")} />
        {seriesList.map((s) => {
          const label = getLocalizedSeriesFields(s, locale, messages).name;
          return (
            <FilterPill
              key={s.slug}
              href={`/shop?series=${s.slug}`}
              active={active === s.slug}
              label={label}
            />
          );
        })}
      </div>

      {active != null && (
        <p className="mt-6 text-sm text-muted">
          {t("showingSeries", {
            series: getLocalizedSeriesFields(getSeriesBySlug(active)!, locale, messages).name,
            count: list.length,
          })}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {list.map((p, i) => (
          <ProductCard
            key={p.slug}
            product={p}
            cardImageUrl={cardImages[i] ?? undefined}
            imagePriority={i < 2}
          />
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          {t("emptyCategory")}{" "}
          <Link href="/shop" className="underline underline-offset-4">
            {t("clearFilter")}
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
          : "border-line bg-white/60 text-ink/75 hover:border-ink/15 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
