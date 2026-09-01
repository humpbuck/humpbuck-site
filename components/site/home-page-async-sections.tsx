import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { HomeDigitempSpotlight } from "@/components/site/home-digitemp-spotlight";
import { HomeFeaturedProductsSection } from "@/components/site/home-featured-products-section";
import { HomeRecommendedProducts } from "@/components/site/home-recommended-products";
import { PreloadHomeFeaturedImages } from "@/components/site/preload-home-featured-images";
import { getProductMovement, type Product } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { R2 } from "@/lib/r2";
import { mapToStorefrontCardProducts } from "@/lib/storefront-card-product";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { getProductFiveStarReviewCounts } from "@/lib/product-reviews-queries";
import { productHref as catalogProductHref } from "@/lib/product-path";

async function fiveStarCountsForSlugs(slugs: string[]) {
  if (slugs.length === 0) return {};
  const map = await getProductFiveStarReviewCounts(slugs);
  return Object.fromEntries(map.entries());
}

export async function HomeRecommendedAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const adminPicked = all
    .filter((p) => p.homeRecommended)
    .sort(
      (a, b) =>
        (a.homeRecommendedSort ?? 0) - (b.homeRecommendedSort ?? 0) ||
        a.slug.localeCompare(b.slug),
    );
  /** Admin picks win; if none, fall back to Automatic-first fill (legacy). */
  let recommendedRaw: Product[];
  if (adminPicked.length > 0) {
    recommendedRaw = adminPicked.slice(0, 12);
  } else {
    const mechanicalAll = all.filter((p) => getProductMovement(p) === "mechanical");
    recommendedRaw =
      mechanicalAll.length >= 10
        ? mechanicalAll.slice(0, 10)
        : [
            ...mechanicalAll,
            ...all.filter((p) => getProductMovement(p) !== "mechanical"),
          ].slice(0, 10);
  }
  const recommended = recommendedRaw.map((p) =>
    applyStorefrontProductLocale(p, locale, messages),
  );
  const { covers: recommendedCardImages, hovers: recommendedCardHoverImages } =
    await mapProductsToShopCardImages(recommended);
  const recommendedCards = mapToStorefrontCardProducts(
    recommended,
    recommendedCardImages,
  );
  const recommendedImageUrls = recommendedCards.map((p) => p.image);
  const fiveStarReviewCounts = await fiveStarCountsForSlugs(
    recommendedCards.map((p) => p.slug),
  );

  return (
    <>
      {recommendedCards.length > 0 ? (
        <PreloadHomeFeaturedImages urls={recommendedImageUrls} />
      ) : null}
      <HomeRecommendedProducts
        products={recommendedCards}
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
              (heroFeatured ?? heroFallback).slug.startsWith("digitemp")
                ? "/ana-digi-watches"
                : catalogProductHref(heroFeatured ?? heroFallback)
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

/** Homepage product grid: 4 columns × 3 rows (12 slots). */
export async function HomeFeaturedAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const featured = all
    .slice(0, 12)
    .map((p) => applyStorefrontProductLocale(p, locale, messages));
  const { covers: featuredCardImages, hovers: featuredCardHoverImages } =
    await mapProductsToShopCardImages(featured);
  const featuredCards = mapToStorefrontCardProducts(featured, featuredCardImages);
  const featuredImageUrls = featuredCards.map((p) => p.image);
  const fiveStarReviewCounts = await fiveStarCountsForSlugs(
    featuredCards.map((p) => p.slug),
  );

  return (
    <>
      {featuredCards.length > 0 ? (
        <PreloadHomeFeaturedImages urls={featuredImageUrls} />
      ) : null}
      <HomeFeaturedProductsSection
        products={featuredCards}
        cardImages={featuredCardImages}
        cardHoverImages={featuredCardHoverImages}
        fiveStarReviewCounts={fiveStarReviewCounts}
      />
    </>
  );
}
