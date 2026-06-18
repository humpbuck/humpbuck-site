"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { StorefrontProductGridTile } from "@/components/site/storefront-product-grid-tile";
import type { Product } from "@/lib/catalog";

/** Desktop: 4 columns × 3 rows. Mobile keeps 2-column grid (6 rows). */
const PAGE_SIZE = 12;

export function HomeFeaturedProductsGrid({
  products,
  cardImages,
}: {
  products: Product[];
  cardImages: (string | undefined)[];
}) {
  const t = useTranslations("Home");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [page, products]);

  const pageCardImages = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return cardImages.slice(start, start + PAGE_SIZE);
  }, [cardImages, page]);

  const globalStartIndex = (page - 1) * PAGE_SIZE;

  return (
    <>
      <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-16 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-10 lg:mt-20 lg:gap-x-6">
        {pageItems.map((product, i) => (
          <StorefrontProductGridTile
            key={product.slug}
            product={product}
            cardImageUrl={pageCardImages[i] ?? undefined}
            imagePriority={globalStartIndex + i < 4}
            imageEager={globalStartIndex + i < 12}
            cartSource="home_featured"
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-line bg-paper px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 transition hover:border-ink/20 hover:text-ink disabled:opacity-40"
          >
            {t("featuredPrev")}
          </button>
          <span className="text-sm tabular-nums text-muted">
            {t("featuredPage", { page, total: totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-line bg-paper px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 transition hover:border-ink/20 hover:text-ink disabled:opacity-40"
          >
            {t("featuredNext")}
          </button>
        </div>
      ) : null}
    </>
  );
}
