import { Suspense } from "react";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { PreloadProductGridImages } from "@/components/site/preload-product-grid-images";
import { ShopCatalogClient } from "@/components/site/shop-catalog-client";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getAllProductCategories } from "@/lib/product-categories";
import { prisma } from "@/lib/prisma";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";

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
}: {
  locale: string;
  /** Kept for Suspense cache keys from the page; filtering is client-side. */
  seriesParam?: string;
  movementParam?: string;
  audienceParam?: string;
  profileParam?: string;
  categoryParam?: string;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Shop");
  void t;

  const [all, categories, latestRow, messages] = await Promise.all([
    getMergedCatalogProducts(),
    getAllProductCategories().catch(() => []),
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

  const cardImagesBySlug: Record<string, string> = {};
  const cardHoverImagesBySlug: Record<string, string> = {};
  list.forEach((p, i) => {
    const cover = cardImages[i]?.trim();
    const hover = cardHoverImages[i]?.trim();
    if (cover) cardImagesBySlug[p.slug] = cover;
    if (hover) cardHoverImagesBySlug[p.slug] = hover;
  });

  const gridImageUrls = list.map(
    (p, i) => cardImages[i]?.trim() || p.image,
  );
  const updatedDate = formatShopUpdatedDate(
    latestRow?.updatedAt ?? new Date(),
    locale,
  );

  return (
    <>
      {list.length > 0 ? <PreloadProductGridImages urls={gridImageUrls} /> : null}
      <Suspense fallback={null}>
        <ShopCatalogClient
          products={list}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
          cardImagesBySlug={cardImagesBySlug}
          cardHoverImagesBySlug={cardHoverImagesBySlug}
          updatedDate={updatedDate}
        />
      </Suspense>
    </>
  );
}
