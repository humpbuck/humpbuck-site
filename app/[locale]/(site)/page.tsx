import type { Metadata } from "next";
import { StorefrontImage } from "@/components/site/storefront-image";
import { getTranslations, getMessages, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { HomeMechanicalHero } from "@/components/site/home-mechanical-hero";
import { HomeMovementCategories } from "@/components/site/home-movement-categories";
import { HomeCategoryProductSliders } from "@/components/site/home-category-product-sliders";
import { HomeFounderStorySection } from "@/components/site/home-founder-story-section";
import { HomeFeaturedProductsSection } from "@/components/site/home-featured-products-section";
import { HomeRecommendedProducts } from "@/components/site/home-recommended-products";
import { PreloadHomeFeaturedImages } from "@/components/site/preload-home-featured-images";
import { NewsletterSubscribe } from "@/components/site/NewsletterSubscribe";
import { routing } from "@/i18n/routing";
import { formatPrice, getProductMovement } from "@/lib/catalog";
import { resolveHomeWatchSectionProducts } from "@/lib/home-watch-sections";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { R2 } from "@/lib/r2";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { getProductFiveStarReviewCounts } from "@/lib/product-reviews-queries";
import { ProductFiveStarRating } from "@/components/site/product-five-star-rating";

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
          <div className="mx-auto flex w-full max-w-sm flex-col gap-10 md:max-w-none md:flex-row md:items-center md:justify-center md:gap-12 lg:gap-16 xl:gap-20">
          <div className="relative mx-auto w-full max-w-sm min-w-0 shrink-0 md:mx-0 md:max-w-[340px] lg:max-w-[400px]">
            {(heroFeatured ?? heroFallback) ? (
              <Link
                href={(heroFeatured ?? heroFallback).slug === "digitemp" ? "/product?series=digitemp" : `/product/${(heroFeatured ?? heroFallback).slug}`}
                className="group relative block aspect-square overflow-hidden rounded-[24px] border border-line/70 bg-white shadow-sm transition outline-offset-4 hover:-translate-y-0.5 hover:border-line hover:shadow-md focus-visible:outline-2 focus-visible:outline-ink/30 sm:rounded-[28px]"
              >
                <StorefrontImage
                  src={R2.home.digitemp2301Webp}
                  alt={t("heroFeaturedAlt")}
                  fill
                  priority
                  fetchPriority="high"
                  quality={68}
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width:767px) 92vw, 400px"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-line/80 bg-paper/95 p-3.5 shadow-sm backdrop-blur-sm sm:bottom-5 sm:left-5 sm:right-5 sm:p-4">
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
                        {t("heroFeaturedLabel")}
                      </div>
                      <div className="mt-1 font-serif text-base text-ink sm:text-lg">{(heroFeatured ?? heroFallback).name}</div>
                      {heroFeatured ? (
                        <ProductFiveStarRating count={heroFiveStarCount} compact className="mt-1" />
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold tabular-nums text-ink sm:text-xl">
                        {formatPrice((heroFeatured ?? heroFallback).price)}
                      </div>
                      {(heroFeatured ?? heroFallback).compareAtPrice != null && (
                        <div className="text-[12px] text-muted line-through tabular-nums">
                          {formatPrice((heroFeatured ?? heroFallback).compareAtPrice!)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-ink py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-paper transition group-hover:bg-ink/90 sm:mt-4 sm:py-2.5 sm:text-[11px]">
                    {t("heroViewProduct")}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[24px] border border-line bg-white/60 p-8 text-center text-muted sm:rounded-[28px]">
                <div>
                  <div className="font-serif text-2xl text-ink">{t("heroComingSoonTitle")}</div>
                  <p className="mt-3 text-sm">{t("heroComingSoonBody")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 md:max-w-[20rem] md:flex-none lg:max-w-[24rem]">
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white/60 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.2em] text-muted sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[8px]">
              <Sparkles className="h-2.5 w-2.5 shrink-0 text-digital-dim sm:h-3 sm:w-3" strokeWidth={2} />
              {t("heroBadge")}
            </div>
            <h2 className="mt-6 font-serif font-normal leading-[1.05] tracking-[-0.02em] text-ink md:mt-5">
              <span className="block w-full max-w-full min-w-0 whitespace-nowrap leading-[1.08] text-[clamp(1.45rem,min(5vw+0.45rem,2.2rem),2.2rem)] md:text-[clamp(1.85rem,2.2vw,2.35rem)] lg:text-[clamp(2rem,2vw,2.65rem)]">
                HUMPBUCK{" "}
                <span className="inline">DIGI{"\u2011"}TEMP</span>
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:mt-5 md:max-w-none md:text-[17px] md:leading-[1.65] lg:mt-6 lg:text-lg lg:leading-relaxed">
              {t("heroLead2")}
            </p>
          </div>
          </div>
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
