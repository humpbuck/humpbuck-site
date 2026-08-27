import { Suspense } from "react";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { PreloadProductGridImages } from "@/components/site/preload-product-grid-images";
import { ShopCatalogClient } from "@/components/site/shop-catalog-client";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getFixedStorefrontCategories } from "@/lib/product-categories";
import { prisma } from "@/lib/prisma";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { mapToStorefrontCardProducts } from "@/lib/storefront-card-product";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { getWatchCategoryBySlug } from "@/lib/storefront-watch-categories";

function formatShopUpdatedDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export async function ShopCatalogAsyncSection({
  locale,
  activeCategorySlug = null,
}: {
  locale: string;
  /** Path-based collection slug (`ana-digi` …); null = all watches. */
  activeCategorySlug?: string | null;
}) {
  setRequestLocale(locale);
  const [t, tWatch] = await Promise.all([
    getTranslations("Shop"),
    getTranslations("WatchCollections"),
  ]);
  void t;

  const [all, categories, latestRow, messages] = await Promise.all([
    getMergedCatalogProducts(),
    getFixedStorefrontCategories().catch(() => []),
    prisma.catalogProduct
      .findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      })
      .catch(() => null),
    getMessages({ locale }),
  ]);

  const list = all.map((p) => applyStorefrontProductLocale(p, locale, messages));
  const { covers: cardImages, hovers: cardHoverImages } =
    await mapProductsToShopCardImages(list);
  const cardProducts = mapToStorefrontCardProducts(list, cardImages);

  const cardImagesBySlug: Record<string, string> = {};
  const cardHoverImagesBySlug: Record<string, string> = {};
  cardProducts.forEach((p, i) => {
    const cover = cardImages[i]?.trim();
    const hover = cardHoverImages[i]?.trim();
    if (cover) cardImagesBySlug[p.slug] = cover;
    if (hover) cardHoverImagesBySlug[p.slug] = hover;
  });

  const gridImageUrls = cardProducts.map((p) => p.image);
  const updatedDate = formatShopUpdatedDate(
    latestRow?.updatedAt ?? new Date(),
    locale,
  );

  const localizedCategories = categories.map((c) => {
    const def = getWatchCategoryBySlug(c.slug);
    return {
      id: c.id,
      name: def ? tWatch(`${def.messageKey}.name`) : c.name,
      slug: c.slug,
    };
  });

  return (
    <>
      {cardProducts.length > 0 ? (
        <PreloadProductGridImages urls={gridImageUrls} />
      ) : null}
      <Suspense fallback={null}>
        <ShopCatalogClient
          products={cardProducts}
          categories={localizedCategories}
          cardImagesBySlug={cardImagesBySlug}
          cardHoverImagesBySlug={cardHoverImagesBySlug}
          updatedDate={updatedDate}
          activeCategorySlug={activeCategorySlug}
        />
      </Suspense>
    </>
  );
}
