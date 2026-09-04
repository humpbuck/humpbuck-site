import { getTranslations } from "next-intl/server";
import { HomeProductSliderSection } from "@/components/site/home-product-slider-section";
import type { Product } from "@/lib/catalog";
import type { StorefrontWatchCategoryDef } from "@/lib/storefront-watch-categories";

export type HomeRecommendedCategorySection = {
  category: StorefrontWatchCategoryDef;
  title: string;
  products: Product[];
  cardImages: (string | undefined)[];
  cardHoverImages: (string | undefined)[];
  fiveStarReviewCounts: Record<string, number>;
};

export async function HomeRecommendedProducts({
  sections,
}: {
  sections: HomeRecommendedCategorySection[];
}) {
  const t = await getTranslations("Home");

  if (sections.length === 0) {
    return (
      <HomeProductSliderSection
        headingId="home-recommended-heading"
        title={t("recommendedTitle")}
        viewAllHref="/watches"
        viewAllLabel={t("recommendedViewAll")}
        products={[]}
        cardImages={[]}
        cardHoverImages={[]}
        fiveStarReviewCounts={{}}
        cartSource="home_recommended"
      />
    );
  }

  return (
    <>
      {sections.map((section) => (
        <HomeProductSliderSection
          key={section.category.slug}
          headingId={`home-recommended-${section.category.slug}-heading`}
          title={section.title}
          viewAllHref={section.category.path}
          viewAllLabel={t("recommendedViewAll")}
          products={section.products}
          cardImages={section.cardImages}
          cardHoverImages={section.cardHoverImages}
          fiveStarReviewCounts={section.fiveStarReviewCounts}
          cartSource={`home_recommended_${section.category.slug}`}
        />
      ))}
    </>
  );
}
