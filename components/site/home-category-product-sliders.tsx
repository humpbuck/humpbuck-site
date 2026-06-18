import { HomeProductSliderSection } from "@/components/site/home-product-slider-section";
import { getTranslations } from "next-intl/server";
import type { Product } from "@/lib/catalog";

export async function HomeCategoryProductSliders({
  mechanicalProducts,
  mechanicalCardImages,
  quartzProducts,
  quartzCardImages,
  ultraThinProducts,
  ultraThinCardImages,
}: {
  mechanicalProducts: Product[];
  mechanicalCardImages: (string | undefined)[];
  quartzProducts: Product[];
  quartzCardImages: (string | undefined)[];
  ultraThinProducts: Product[];
  ultraThinCardImages: (string | undefined)[];
}) {
  const t = await getTranslations("Home");
  const kicker = t("categoryRowKicker");

  return (
    <>
      <HomeProductSliderSection
        headingId="home-mechanical-watches-heading"
        kicker={kicker}
        title={t("mechanicalWatchesTitle")}
        viewAllHref="/product?movement=mechanical"
        viewAllLabel={t("mechanicalWatchesShop")}
        products={mechanicalProducts}
        cardImages={mechanicalCardImages}
        cartSource="home_mechanical_row"
      />
      <HomeProductSliderSection
        headingId="home-quartz-watches-heading"
        kicker={kicker}
        title={t("quartzWatchesTitle")}
        viewAllHref="/product?movement=quartz"
        viewAllLabel={t("quartzWatchesShop")}
        products={quartzProducts}
        cardImages={quartzCardImages}
        cartSource="home_quartz_row"
      />
      <HomeProductSliderSection
        headingId="home-ultra-thin-watches-heading"
        kicker={kicker}
        title={t("ultraThinWatchesTitle")}
        viewAllHref="/product?profile=ultra-thin"
        viewAllLabel={t("ultraThinWatchesShop")}
        products={ultraThinProducts}
        cardImages={ultraThinCardImages}
        cartSource="home_ultra_thin_row"
      />
    </>
  );
}
