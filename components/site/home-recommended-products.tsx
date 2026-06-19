import { getTranslations } from "next-intl/server";
import { HomeProductSliderSection } from "@/components/site/home-product-slider-section";
import type { Product } from "@/lib/catalog";

export async function HomeRecommendedProducts({
  products,
  cardImages,
  cardHoverImages,
}: {
  products: Product[];
  cardImages: (string | undefined)[];
  cardHoverImages: (string | undefined)[];
}) {
  const t = await getTranslations("Home");

  return (
    <HomeProductSliderSection
      headingId="home-recommended-heading"
      title={t("recommendedTitle")}
      viewAllHref="/product?movement=mechanical"
      viewAllLabel={t("recommendedViewAll")}
      products={products}
      cardImages={cardImages}
      cardHoverImages={cardHoverImages}
      cartSource="home_recommended"
    />
  );
}
