import type { Metadata } from "next";
import { getTranslations, getMessages, setRequestLocale } from "next-intl/server";
import { Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { HomeDigitempSpotlight } from "@/components/site/home-digitemp-spotlight";
import { HomeMechanicalHero } from "@/components/site/home-mechanical-hero";
import { HomeMovementCategories } from "@/components/site/home-movement-categories";
import { HomeCategoryProductSliders } from "@/components/site/home-category-product-sliders";
import { HomeFounderStorySection } from "@/components/site/home-founder-story-section";
import { HomeFeaturedProductsSection } from "@/components/site/home-featured-products-section";
import { HomeRecommendedProducts } from "@/components/site/home-recommended-products";
import { PreloadHomeFeaturedImages } from "@/components/site/preload-home-featured-images";
import { NewsletterSubscribe } from "@/components/site/NewsletterSubscribe";
import { routing } from "@/i18n/routing";
import { getProductMovement } from "@/lib/catalog";
import { resolveHomeWatchSectionProducts } from "@/lib/home-watch-sections";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { R2 } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { getProductFiveStarReviewCounts } from "@/lib/product-reviews-queries";

/** Regenerate from DB periodically; admin saves also revalidate catalog tags. Keep in sync with `STOREFRONT_ISR_SECONDS`. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  const base = getSiteUrl();
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const openGraphUrl = pathPrefix ? `${base}${pathPrefix}` : base;

  return {
    title: {
      absolute: t("metaTitle"),
    },
    description: t("metaDescription"),
    alternates: {
      canonical: pathPrefix ? `${pathPrefix}/` : "/",
      languages: storefrontHreflangLanguages("/"),
    },
    openGraph: {
      url: openGraphUrl,
      type: "website",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage.url],
    },
  };
}

async function buildHomeWatchSlider(
  section: "mechanical" | "quartz" | "ultra-thin",
  all: Awaited<ReturnType<typeof getMergedCatalogProducts>>,
  locale: string,
  messages: Awaited<ReturnType<typeof getMessages>>,
) {
  const localized = all.map((p) => applyStorefrontProductLocale(p, locale, messages));
  const products = resolveHomeWatchSectionProducts(localized, section);
  const { covers: cardImages, hovers: cardHoverImages } = await mapProductsToShopCardImages(products);
  return { products, cardImages, cardHoverImages };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const featured = all.map((p) => applyStorefrontProductLocale(p, locale, messages));
  const { covers: featuredCardImages, hovers: featuredCardHoverImages } =
    await mapProductsToShopCardImages(featured);
  const featuredImageUrls = featured
    .slice(0, 12)
    .map((p, i) => featuredCardImages[i]?.trim() || p.image);
  const mechanicalAll = all.filter((p) => getProductMovement(p) === "mechanical");
  const recommendedRaw =
    mechanicalAll.length >= 10
      ? mechanicalAll.slice(0, 10)
      : [
          ...mechanicalAll,
          ...all.filter((p) => getProductMovement(p) !== "mechanical"),
        ].slice(0, 10);
  const recommended = recommendedRaw.map((p) =>
    applyStorefrontProductLocale(p, locale, messages),
  );
  const { covers: recommendedCardImages, hovers: recommendedCardHoverImages } =
    await mapProductsToShopCardImages(recommended);
  const recommendedImageUrls = recommended.map(
    (p, i) => recommendedCardImages[i]?.trim() || p.image,
  );
  const mechanicalSlider = await buildHomeWatchSlider("mechanical", all, locale, messages);
  const quartzSlider = await buildHomeWatchSlider("quartz", all, locale, messages);
  const ultraThinSlider = await buildHomeWatchSlider("ultra-thin", all, locale, messages);
  const homeProductSlugs = [
    ...new Set([
      ...featured.map((p) => p.slug),
      ...recommended.map((p) => p.slug),
      ...mechanicalSlider.products.map((p) => p.slug),
      ...quartzSlider.products.map((p) => p.slug),
      ...ultraThinSlider.products.map((p) => p.slug),
    ]),
  ];
  const fiveStarCountsMap = await getProductFiveStarReviewCounts(homeProductSlugs);
  const fiveStarReviewCounts = Object.fromEntries(fiveStarCountsMap.entries());
  const heroFeaturedRaw =
    all.find((p) => p.slug === "2301" || p.slug === "digitemp-2301") ?? [...all].slice(0, 12)[0] ?? null;
  const heroFeatured = heroFeaturedRaw
    ? applyStorefrontProductLocale(heroFeaturedRaw, locale, messages)
    : null;
  const heroFiveStarCount = heroFeatured
    ? (fiveStarReviewCounts[heroFeatured.slug] ?? 0)
    : 0;
  const heroFallback = {
    slug: "digitemp",
    name: "HUMPBUCK DIGI-TEMP",
    price: 0,
    compareAtPrice: undefined,
  };
  const deferredSectionStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "1000px",
  } as const;

  return (
    <div>
      {featured.length > 0 ? <PreloadHomeFeaturedImages urls={featuredImageUrls} /> : null}
      {recommended.length > 0 ? (
        <PreloadHomeFeaturedImages urls={recommendedImageUrls} />
      ) : null}
      <HomeMechanicalHero />
      <HomeMovementCategories />
      <HomeRecommendedProducts
        products={recommended}
        cardImages={recommendedCardImages}
        cardHoverImages={recommendedCardHoverImages}
        fiveStarReviewCounts={fiveStarReviewCounts}
      />
      {/* Series spotlight — HUMPBUCK DIGI-TEMP */}
      <section className="border-b border-line bg-paper text-ink">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:py-20">
          {(heroFeatured ?? heroFallback) ? (
            <HomeDigitempSpotlight
              productHref={
                (heroFeatured ?? heroFallback).slug === "digitemp"
                  ? "/product?series=digitemp"
                  : `/product/${(heroFeatured ?? heroFallback).slug}`
              }
              productName={(heroFeatured ?? heroFallback).name}
              baseImage={R2.home.digitemp2301SpotlightWebp}
              imageAlt={t("heroFeaturedAlt")}
              featuredLabel={t("heroFeaturedLabel")}
              viewProductLabel={t("heroViewProduct")}
              heroBadge={t("heroBadge")}
              heroLead={t("heroLead2")}
              price={(heroFeatured ?? heroFallback).price}
              compareAtPrice={(heroFeatured ?? heroFallback).compareAtPrice}
              fiveStarCount={heroFiveStarCount}
              showRating={heroFeatured != null}
              variantOptions={heroFeatured?.variantOptions ?? []}
            />
          ) : (
            <div className="mx-auto flex w-full max-w-sm flex-col gap-10 md:max-w-none md:flex-row md:items-center md:justify-center md:gap-12 lg:gap-16 xl:gap-20">
              <div className="flex aspect-square w-full max-w-sm items-center justify-center rounded-[24px] border border-line bg-white/60 p-8 text-center text-muted sm:rounded-[28px]">
                <div>
                  <div className="font-serif text-2xl text-ink">{t("heroComingSoonTitle")}</div>
                  <p className="mt-3 text-sm">{t("heroComingSoonBody")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <HomeFeaturedProductsSection
        products={featured}
        cardImages={featuredCardImages}
        cardHoverImages={featuredCardHoverImages}
        fiveStarReviewCounts={fiveStarReviewCounts}
      />

      <HomeCategoryProductSliders
        mechanicalProducts={mechanicalSlider.products}
        mechanicalCardImages={mechanicalSlider.cardImages}
        mechanicalCardHoverImages={mechanicalSlider.cardHoverImages}
        quartzProducts={quartzSlider.products}
        quartzCardImages={quartzSlider.cardImages}
        quartzCardHoverImages={quartzSlider.cardHoverImages}
        ultraThinProducts={ultraThinSlider.products}
        ultraThinCardImages={ultraThinSlider.cardImages}
        ultraThinCardHoverImages={ultraThinSlider.cardHoverImages}
        fiveStarReviewCounts={fiveStarReviewCounts}
      />

      <HomeFounderStorySection />

      {/* Stats + trust */}
      <section
        className="border-t border-line bg-white/55 py-14"
        style={deferredSectionStyle}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {(
            [
              { k: "10k+", labelKey: "statActiveCustomers" as const },
              { k: "25k+", labelKey: "statOrdersFulfilled" as const },
              { k: "50+", labelKey: "statCountriesShipped" as const },
              { k: "24/7", labelKey: "statSupport" as const },
            ] as const
          ).map((s) => (
            <div key={s.labelKey} className="text-center lg:text-left">
              <div className="font-serif text-4xl tabular-nums">{s.k}</div>
              <div className="mt-2 text-[12px] uppercase tracking-[0.16em] text-muted">
                {t(s.labelKey)}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <ShieldCheck
              className="mt-0.5 text-digital-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustSecureTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustSecureBody")}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <Globe2
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustGlobalTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustGlobalBody")}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <Sparkles
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustLaunchTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustLaunchBody")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section
        id="newsletter"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
        style={deferredSectionStyle}
      >
        <div className="rounded-3xl border border-line bg-white/70 p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t("newsletterKicker")}
              </div>
              <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
                {t("newsletterTitle")}
              </h2>
              <p className="mt-3 text-sm text-muted">{t("newsletterBody")}</p>
            </div>
            <NewsletterSubscribe />
          </div>
        </div>
      </section>
    </div>
  );
}
