"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StorefrontProductGridTile } from "@/components/site/storefront-product-grid-tile";
import type { Product } from "@/lib/catalog";

/** Desktop: 4 columns × 3 rows. Mobile keeps 2-column grid. */
const GRID_SLOTS = 12;

export function HomeFeaturedProductsGrid({
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
  const t = useTranslations("Home");
  const items = products.slice(0, GRID_SLOTS);

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-10 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-10 lg:gap-x-6">
        {items.map((product, i) => (
          <StorefrontProductGridTile
            key={product.slug}
            product={product}
            cardImageUrl={cardImages[i] ?? undefined}
            cardHoverImageUrl={cardHoverImages[i] ?? undefined}
            imagePriority={i < 4}
            imageEager={i < 12}
            cartSource="home_featured"
            fiveStarReviewCount={fiveStarReviewCounts[product.slug] ?? 0}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/watches"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-6 text-[11px] font-semibold uppercase tracking-widest text-ink/85 transition hover:border-ink/20 hover:text-ink"
        >
          {t("browseFullCatalog")}
        </Link>
      </div>
    </>
  );
}
