import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { PreloadProductGridImages } from "@/components/site/preload-product-grid-images";
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
import { getShopCardR2GalleryImage } from "@/lib/r2-card-image";
import { routing } from "@/i18n/routing";
import { applyStorefrontProductLocale, getLocalizedSeriesFields } from "@/lib/storefront-locale";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

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

  const cardImages = await Promise.all(
    list.map((p) =>
      getShopCardR2GalleryImage(p.slug, p.image, p.galleryImages ?? p.images),
    ),
  );
  const gridImageUrls = list.map((p, i) => cardImages[i]?.trim() || p.image);

  const activeSeriesLabel =
    active != null
      ? getSeriesBySlug(active)
        ? getLocalizedSeriesFields(getSeriesBySlug(active)!, locale, messages).name
        : seriesFilters.find((s) => s.slug === active)?.name ?? active
      : null;
  const activeMovementLabel =
    activeMovement === "mechanical"
      ? t("filterMechanical")
      : activeMovement === "quartz"
        ? t("filterQuartz")
        : null;
  const activeProfileLabel =
    activeProfile === "ultra-thin" ? t("filterUltraThin") : null;
  const activeAudienceLabel =
    activeAudience === "men"
      ? t("filterMen")
      : activeAudience === "women"
        ? t("filterWomen")
        : null;

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

      <div className="mt-10 flex flex-wrap gap-2">
        <FilterPill
          href="/product"
          active={
            active === null &&
            activeMovement === null &&
            activeAudience === null &&
            activeProfile === null
          }
          label={t("filterAll")}
        />
        {seriesFilters.map((s) => {
          const label = getSeriesBySlug(s.slug)
            ? getLocalizedSeriesFields(getSeriesBySlug(s.slug)!, locale, messages).name
            : s.name;
          return (
            <FilterPill
              key={s.slug}
              href={`/product?series=${s.slug}`}
              active={active === s.slug}
              label={label}
            />
          );
        })}
      </div>

      {active != null && activeSeriesLabel && (
        <p className="mt-6 text-sm text-muted">
          {t("showingSeries", {
            series: activeSeriesLabel,
            count: list.length,
          })}
        </p>
      )}

      {active == null && activeProfileLabel && !activeMovementLabel && !activeAudienceLabel && (
        <p className="mt-6 text-sm text-muted">
          {t("showingProfile", {
            profile: activeProfileLabel,
            count: list.length,
          })}
        </p>
      )}

      {active == null && activeMovementLabel && !activeAudienceLabel && !activeProfileLabel && (
        <p className="mt-6 text-sm text-muted">
          {t("showingMovement", {
            movement: activeMovementLabel,
            count: list.length,
          })}
        </p>
      )}

      {(activeMovementLabel || activeAudienceLabel) &&
        (activeMovementLabel && activeAudienceLabel ? (
          <p className="mt-6 text-sm text-muted">
            {t("showingMovementAudience", {
              movement: activeMovementLabel,
              audience: activeAudienceLabel,
              count: list.length,
            })}
          </p>
        ) : activeAudienceLabel ? (
          <p className="mt-6 text-sm text-muted">
            {t("showingAudience", {
              audience: activeAudienceLabel,
              count: list.length,
            })}
          </p>
        ) : null)}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {list.map((p, i) => (
          <ProductCard
            key={p.slug}
            product={p}
            cardImageUrl={cardImages[i] ?? undefined}
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
