import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
      aria-labelledby="home-featured-products-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2
              id="home-featured-products-heading"
              className="font-serif text-2xl tracking-tight text-ink sm:text-3xl lg:text-4xl"
            >
              {t("featuredReadyTitle")}
            </h2>
            <p className="mt-2 hidden text-sm leading-relaxed text-muted sm:mt-3 sm:block sm:text-base lg:text-lg">
              {t("featuredReadySubtitle")}
            </p>
          </div>
          <Link
            href="/product"
            className="shrink-0 self-end text-sm font-medium text-muted transition hover:text-ink sm:self-auto sm:pt-1"
          >
            {t("featuredViewAll")}
          </Link>
        </div>

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
