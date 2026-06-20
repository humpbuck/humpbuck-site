import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { PreloadProductGridImages } from "@/components/site/preload-product-grid-images";
import { ShopProductFilters } from "@/components/site/shop-product-filters";
import {
  getSeriesBySlug,
  getShopSeriesFilters,
  getProductMovement,
  normalizeSeriesSlug,
  normalizeShopMovementParam,
  normalizeShopAudienceParam,
  normalizeShopProfileParam,
  productMatchesAudience,
  productMatchesUltraThin,
} from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import {
  hasStorefrontDbPlacements,
  productHasStorefrontUltraThinSeries,
} from "@/lib/home-watch-sections";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { routing } from "@/i18n/routing";
import { applyStorefrontProductLocale, getLocalizedSeriesFields } from "@/lib/storefront-locale";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { shopCatalogFiltersActive } from "@/lib/shop-filter-url";

/** Keep in sync with `STOREFRONT_ISR_SECONDS`. */
export const revalidate = 300;

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
      canonical: `${pathPrefix}/product`,
      languages: storefrontHreflangLanguages("/product"),
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function ProductCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ series?: string; movement?: string; audience?: string; profile?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const { series: seriesParam, movement: movementParam, audience: audienceParam, profile: profileParam } =
    await searchParams;
  const all = await getMergedCatalogProducts();
  const useStorefrontPlacements = hasStorefrontDbPlacements(all);
  const seriesFilters = getShopSeriesFilters(all);
  const filterSlugs = new Set(seriesFilters.map((s) => s.slug));
  const requested = normalizeSeriesSlug(seriesParam ?? "");
  const active = requested && filterSlugs.has(requested) ? requested : null;
  const activeMovement = normalizeShopMovementParam(movementParam);
  const activeAudience = normalizeShopAudienceParam(audienceParam);
  const activeProfile = normalizeShopProfileParam(profileParam);
  const messages = await getMessages({ locale });
  const list = (
    active || activeMovement || activeAudience || activeProfile
      ? all.filter((p) => {
          if (active && normalizeSeriesSlug(p.seriesSlug) !== active) return false;
          if (activeMovement && getProductMovement(p) !== activeMovement) return false;
          if (activeAudience && !productMatchesAudience(p, activeAudience)) return false;
          if (activeProfile === "ultra-thin") {
            const matchesUltraThin = useStorefrontPlacements
              ? productHasStorefrontUltraThinSeries(p)
              : productMatchesUltraThin(p);
            if (!matchesUltraThin) return false;
          }
          return true;
        })
      : all
  ).map((p) => applyStorefrontProductLocale(p, locale, messages));

  const { covers: cardImages, hovers: cardHoverImages } =
    await mapProductsToShopCardImages(list);
  const gridImageUrls = list.map((p, i) => cardImages[i]?.trim() || p.image);

  const activeSeriesLabel =
    active != null
      ? getSeriesBySlug(active)
        ? getLocalizedSeriesFields(getSeriesBySlug(active)!, locale, messages).name
        : seriesFilters.find((s) => s.slug === active)?.name ?? active
      : null;
  const activeFilterLabels = [
    activeSeriesLabel,
    activeMovement === "mechanical"
      ? t("filterMechanical")
      : activeMovement === "quartz"
        ? t("filterQuartz")
        : null,
    activeAudience === "men"
      ? t("filterMen")
      : activeAudience === "women"
        ? t("filterWomen")
        : null,
    activeProfile === "ultra-thin" ? t("filterUltraThin") : null,
  ].filter(Boolean) as string[];
  const seriesFilterOptions = seriesFilters.map((s) => ({
    slug: s.slug,
    label: getSeriesBySlug(s.slug)
      ? getLocalizedSeriesFields(getSeriesBySlug(s.slug)!, locale, messages).name
      : s.name,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      {list.length > 0 ? <PreloadProductGridImages urls={gridImageUrls} /> : null}
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted">{t("intro")}</p>
      </div>

      <ShopProductFilters
        filters={{
          series: active,
          movement: activeMovement,
          audience: activeAudience,
          profile: activeProfile,
        }}
        seriesOptions={seriesFilterOptions}
      />

      {shopCatalogFiltersActive({
        series: active,
        movement: activeMovement,
        audience: activeAudience,
        profile: activeProfile,
      }) && (
        <p className="mt-4 text-sm text-muted">
          {t("showingFiltered", {
            filters: activeFilterLabels.join(" · "),
            count: list.length,
          })}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {list.map((p, i) => (
          <ProductCard
            key={p.slug}
            product={p}
            cardImageUrl={cardImages[i] ?? undefined}
            cardHoverImageUrl={cardHoverImages[i] ?? undefined}
            imagePriority={i < 2}
            imageEager={i < 4}
          />
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          {t("emptyCategory")}{" "}
          <Link href="/product" className="underline underline-offset-4">
            {t("clearFilter")}
          </Link>
        </p>
      )}
    </div>
  );
}
