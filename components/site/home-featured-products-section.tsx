import { getTranslations } from "next-intl/server";
import { HomeFeaturedProductsGrid } from "@/components/site/home-featured-products";
import type { Product } from "@/lib/catalog";

export async function HomeFeaturedProductsSection({
  products,
  cardImages,
}: {
  products: Product[];
  cardImages: (string | undefined)[];
}) {
  if (products.length === 0) return null;

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
        <HomeFeaturedProductsGrid products={products} cardImages={cardImages} />
      </div>
    </section>
  );
}
