import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { HomeDigitempSpotlight } from "@/components/site/home-digitemp-spotlight";
import { HomeFeaturedProductsSection } from "@/components/site/home-featured-products-section";
import { HomeRecommendedProducts } from "@/components/site/home-recommended-products";
import { PreloadHomeFeaturedImages } from "@/components/site/preload-home-featured-images";
import type { Product } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { MAX_HOME_RECOMMENDED } from "@/lib/catalog-home-recommended-limits";
import {
  HOME_RECOMMENDED_CATEGORY_ORDER,
  homeRecommendedCategoryDefs,
  homeRecommendedCategorySlugOf,
  type HomeRecommendedCategorySlug,
} from "@/lib/home-recommended-categories";
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

const HOME_SECTION_TITLE_KEYS: Record<
  HomeRecommendedCategorySlug,
  | "homeSectionAnaDigi"
  | "homeSectionDigital"
  | "homeSectionAnalog"
  | "homeSectionAutomatic"
> = {
  "ana-digi": "homeSectionAnaDigi",
  digital: "homeSectionDigital",
  analog: "homeSectionAnalog",
  automatic: "homeSectionAutomatic",
};

function groupHomeRecommendedByCategory(
  products: Product[],
): Record<HomeRecommendedCategorySlug, Product[]> {
  const buckets: Record<HomeRecommendedCategorySlug, Product[]> = {
    "ana-digi": [],
    digital: [],
    analog: [],
    automatic: [],
  };
  for (const product of products) {
    const slug = homeRecommendedCategorySlugOf(product.categoryId);
    if (!slug) continue;
    buckets[slug].push(product);
  }
  return buckets;
}

/** When admin has no picks, fill up to MAX across the four categories. */
function fallbackHomeRecommendedByCategory(
  all: Product[],
): Record<HomeRecommendedCategorySlug, Product[]> {
  const buckets: Record<HomeRecommendedCategorySlug, Product[]> = {
    "ana-digi": [],
    digital: [],
    analog: [],
    automatic: [],
  };
  let remaining = MAX_HOME_RECOMMENDED;
  const perCategory = Math.max(
    1,
    Math.floor(MAX_HOME_RECOMMENDED / HOME_RECOMMENDED_CATEGORY_ORDER.length),
  );
  for (const slug of HOME_RECOMMENDED_CATEGORY_ORDER) {
    if (remaining <= 0) break;
    const take = Math.min(perCategory, remaining);
    const picked = all
      .filter((p) => homeRecommendedCategorySlugOf(p.categoryId) === slug)
      .slice(0, take);
    buckets[slug] = picked;
    remaining -= picked.length;
  }
  if (remaining > 0) {
    for (const slug of HOME_RECOMMENDED_CATEGORY_ORDER) {
      if (remaining <= 0) break;
      const already = new Set(buckets[slug].map((p) => p.slug));
      const extra = all
        .filter((p) => homeRecommendedCategorySlugOf(p.categoryId) === slug)
        .filter((p) => !already.has(p.slug))
        .slice(0, remaining);
      buckets[slug] = [...buckets[slug], ...extra];
      remaining -= extra.length;
    }
  }
  return buckets;
}

export async function HomeRecommendedAsyncSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const all = await getMergedCatalogProducts();
  const messages = await getMessages({ locale });
  const adminPicked = all
    .filter((p) => p.homeRecommended)
    .sort(
      (a, b) =>
        (a.homeRecommendedSort ?? 0) - (b.homeRecommendedSort ?? 0) ||
        a.slug.localeCompare(b.slug),
    )
    .slice(0, MAX_HOME_RECOMMENDED);

  const byCategory =
    adminPicked.length > 0
      ? groupHomeRecommendedByCategory(adminPicked)
      : fallbackHomeRecommendedByCategory(all);

  const categoryDefs = homeRecommendedCategoryDefs();
  const sections = [];

  for (const def of categoryDefs) {
    const slug = def.slug as HomeRecommendedCategorySlug;
    const raw = byCategory[slug] ?? [];
    if (raw.length === 0) continue;
    const localized = raw.map((p) =>
      applyStorefrontProductLocale(p, locale, messages),
    );
    const { covers, hovers } = await mapProductsToShopCardImages(localized);
    const cards = mapToStorefrontCardProducts(localized, covers);
    const fiveStarReviewCounts = await fiveStarCountsForSlugs(
      cards.map((p) => p.slug),
    );
    sections.push({
      category: def,
      title: t(HOME_SECTION_TITLE_KEYS[slug]),
      products: cards,
      cardImages: covers,
      cardHoverImages: hovers,
      fiveStarReviewCounts,
    });
  }

  const preloadUrls = sections.flatMap((s) => s.products.map((p) => p.image));

  return (
    <>
      {preloadUrls.length > 0 ? (
        <PreloadHomeFeaturedImages urls={preloadUrls} />
      ) : null}
      <HomeRecommendedProducts sections={sections} />
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
  const adminPicked = all
    .filter((p) => p.homeFeatured)
    .sort(
      (a, b) =>
        (a.homeFeaturedSort ?? 0) - (b.homeFeaturedSort ?? 0) ||
        a.slug.localeCompare(b.slug),
    );
  /** Admin picks win; if none, fall back to first 12 catalog products (legacy). */
  const featuredRaw =
    adminPicked.length > 0 ? adminPicked.slice(0, 12) : all.slice(0, 12);
  const featured = featuredRaw.map((p) =>
    applyStorefrontProductLocale(p, locale, messages),
  );
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
