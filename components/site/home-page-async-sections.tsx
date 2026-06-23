import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { HomeDigitempSpotlight } from "@/components/site/home-digitemp-spotlight";
import { HomeCategoryProductSliders } from "@/components/site/home-category-product-sliders";
import { HomeFeaturedProductsSection } from "@/components/site/home-featured-products-section";
import { HomeRecommendedProducts } from "@/components/site/home-recommended-products";
import { PreloadHomeFeaturedImages } from "@/components/site/preload-home-featured-images";
import { getProductMovement, type Product } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { resolveHomeWatchSectionProducts } from "@/lib/home-watch-sections";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { R2 } from "@/lib/r2";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { getProductFiveStarReviewCounts } from "@/lib/product-reviews-queries";

async function buildHomeWatchSlider(
  section: "mechanical" | "quartz" | "ultra-thin",
  all: Product[],
  locale: string,
  messages: Awaited<ReturnType<typeof getMessages>>,
) {
  const localized = all.map((p) => applyStorefrontProductLocale(p, locale, messages));
  const products = resolveHomeWatchSectionProducts(localized, section);
  const { covers: cardImages, hovers: cardHoverImages } =
    await mapProductsToShopCardImages(products);
  return { products, cardImages, cardHoverImages };
}

async function fiveStarCountsForSlugs(slugs: string[]) {
  if (slugs.length === 0) return {};
  const map = await getProductFiveStarReviewCounts(slugs);
  return Object.fromEntries(map.entries());
}

export async function HomeRecommendedAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const mechanicalAll = all.filter((p) => getProductMovement(p) === "mechanical");
  const recommendedRaw =
    mechanicalAll.length >= 10
      ? mechanicalAll.slice(0, 10)
      : [...mechanicalAll, ...all.filter((p) => getProductMovement(p) !== "mechanical")].slice(
          0,
          10,
        );
  const recommended = recommendedRaw.map((p) =>
    applyStorefrontProductLocale(p, locale, messages),
  );
  const { covers: recommendedCardImages, hovers: recommendedCardHoverImages } =
    await mapProductsToShopCardImages(recommended);
  const recommendedImageUrls = recommended.map(
    (p, i) => recommendedCardImages[i]?.trim() || p.image,
  );
  const fiveStarReviewCounts = await fiveStarCountsForSlugs(
    recommended.map((p) => p.slug),
  );

  return (
    <>
      {recommended.length > 0 ? (
        <PreloadHomeFeaturedImages urls={recommendedImageUrls} />
      ) : null}
      <HomeRecommendedProducts
        products={recommended}
        cardImages={recommendedCardImages}
        cardHoverImages={recommendedCardHoverImages}
        fiveStarReviewCounts={fiveStarReviewCounts}
      />
    </>
  );
}

export async function HomeDigitempSpotlightAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const heroFeaturedRaw =
    all.find((p) => p.slug === "2301" || p.slug === "digitemp-2301") ??
    [...all].slice(0, 12)[0] ??
    null;
  const heroFeatured = heroFeaturedRaw
    ? applyStorefrontProductLocale(heroFeaturedRaw, locale, messages)
    : null;
  const heroFallback = {
    slug: "digitemp",
    name: "HUMPBUCK DIGI-TEMP",
    price: 0,
    compareAtPrice: undefined as number | undefined,
  };
  const fiveStarReviewCounts = heroFeatured
    ? await fiveStarCountsForSlugs([heroFeatured.slug])
    : {};
  const heroFiveStarCount = heroFeatured
    ? (fiveStarReviewCounts[heroFeatured.slug] ?? 0)
    : 0;

  return (
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
  );
}

export async function HomeFeaturedAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const featured = all.map((p) => applyStorefrontProductLocale(p, locale, messages));
  const { covers: featuredCardImages, hovers: featuredCardHoverImages } =
    await mapProductsToShopCardImages(featured);
  const featuredImageUrls = featured
    .slice(0, 12)
    .map((p, i) => featuredCardImages[i]?.trim() || p.image);
  const fiveStarReviewCounts = await fiveStarCountsForSlugs(featured.map((p) => p.slug));

  return (
    <>
      {featured.length > 0 ? <PreloadHomeFeaturedImages urls={featuredImageUrls} /> : null}
      <HomeFeaturedProductsSection
        products={featured}
        cardImages={featuredCardImages}
        cardHoverImages={featuredCardHoverImages}
        fiveStarReviewCounts={fiveStarReviewCounts}
      />
    </>
  );
}

export async function HomeCategorySlidersAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const mechanicalSlider = await buildHomeWatchSlider("mechanical", all, locale, messages);
  const quartzSlider = await buildHomeWatchSlider("quartz", all, locale, messages);
  const ultraThinSlider = await buildHomeWatchSlider("ultra-thin", all, locale, messages);
  const sliderSlugs = [
    ...new Set([
      ...mechanicalSlider.products.map((p) => p.slug),
      ...quartzSlider.products.map((p) => p.slug),
      ...ultraThinSlider.products.map((p) => p.slug),
    ]),
  ];
  const fiveStarReviewCounts = await fiveStarCountsForSlugs(sliderSlugs);

  return (
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
  );
}
