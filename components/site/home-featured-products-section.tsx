import { getTranslations } from "next-intl/server";
import { HomeFeaturedProductsGrid } from "@/components/site/home-featured-products";
import { HomeProductsEmptyState } from "@/components/site/home-products-empty-state";
import type { Product } from "@/lib/catalog";

export async function HomeFeaturedProductsSection({
  products,
  cardImages,
  cardHoverImages,
  fiveStarReviewCounts,
}: {
  products: Product[];
  cardImages: (string | undefined)[];
  cardHoverImages: (string | undefined)[];
  fiveStarReviewCounts: Record<string, number>;
}) {
  const t = await getTranslations("Home");

  return (
    <section
      className="border-t border-line bg-paper py-16 sm:py-20"
      aria-labelledby="home-all-products-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2
          id="home-all-products-heading"
          className="text-center font-serif text-2xl tracking-tight text-ink sm:text-3xl lg:text-4xl"
        >
          {t("allProductsHeading")}
        </h2>
        {products.length > 0 ? (
          <HomeFeaturedProductsGrid
            products={products}
            cardImages={cardImages}
            cardHoverImages={cardHoverImages}
            fiveStarReviewCounts={fiveStarReviewCounts}
          />
        ) : (
          <HomeProductsEmptyState className="mt-14 text-center sm:mt-16 lg:mt-20" />
        )}
      </div>
    </section>
  );
}
