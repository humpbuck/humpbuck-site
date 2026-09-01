"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { SubtleHorizontalScroll } from "@/components/site/subtle-horizontal-scroll";
import type { Product } from "@/lib/catalog";
import { shopSeriesHref } from "@/lib/product-category-shared";
import {
  WATCHES_PATH,
  watchCategorySlugFromCategoryId,
} from "@/lib/storefront-watch-categories";

export type ShopCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

function normalizeSearchQuery(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

function productMatchesCategory(
  product: Product,
  active: ShopCategoryOption,
  categories: ShopCategoryOption[],
): boolean {
  if (product.categoryId === active.id) return true;
  const productId = product.categoryId?.trim();
  if (!productId) return false;
  const fromId = watchCategorySlugFromCategoryId(productId);
  if (fromId) return fromId === active.slug;
  const fromList = categories.find((c) => c.id === productId);
  return fromList?.slug === active.slug;
}

export function ShopCatalogClient({
  products,
  categories,
  cardImagesBySlug,
  cardHoverImagesBySlug,
  updatedDate,
  activeCategorySlug = null,
}: {
  products: Product[];
  categories: ShopCategoryOption[];
  cardImagesBySlug: Record<string, string>;
  cardHoverImagesBySlug: Record<string, string>;
  updatedDate: string;
  /** Path-based collection slug; null = all watches. */
  activeCategorySlug?: string | null;
}) {
  const t = useTranslations("Shop");
  const [searchQuery, setSearchQuery] = useState("");

  const activeSeries = useMemo(() => {
    if (!activeCategorySlug) return null;
    return (
      categories.find(
        (c) => c.slug.toLowerCase() === activeCategorySlug.toLowerCase(),
      ) ?? null
    );
  }, [categories, activeCategorySlug]);

  const displayProducts = useMemo(() => {
    let list = products;
    if (activeSeries) {
      list = list.filter((p) =>
        productMatchesCategory(p, activeSeries, categories),
      );
    }
    const q = normalizeSearchQuery(searchQuery);
    if (!q) return list;
    return list.filter((p) => {
      const slug = p.slug.toLowerCase();
      const name = p.name.trim().toLowerCase().replace(/\s+/g, "-");
      return slug.includes(q) || name.includes(q);
    });
  }, [products, searchQuery, activeSeries, categories]);

  const countLabel = searchQuery.trim()
    ? t("searchMatchCount", {
        count: displayProducts.length,
        query: searchQuery.trim(),
      })
    : activeSeries
      ? t("filterMatchCount", {
          count: displayProducts.length,
          filter: activeSeries.name,
        })
      : t("updatedCount", { date: updatedDate, count: displayProducts.length });

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:ml-auto sm:max-w-xs">
          <span className="sr-only">{t("searchPlaceholder")}</span>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </label>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("filterCategories")}
          </p>
          <SubtleHorizontalScroll
            scrollLabel={t("filterCategoriesScroll")}
            scrollerClassName="-mx-1 gap-2 px-1"
            scrollerProps={{
              role: "listbox",
              "aria-label": t("filterCategories"),
            }}
          >
            <Link
              href={WATCHES_PATH}
              role="option"
              aria-selected={!activeSeries}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                !activeSeries
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white text-ink/80 hover:border-ink/25"
              }`}
            >
              {t("filterAll")}
            </Link>
            {categories.map((category) => {
              const selected = activeSeries?.id === category.id;
              return (
                <Link
                  key={category.id}
                  href={shopSeriesHref(category.slug)}
                  role="option"
                  aria-selected={selected}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                    selected
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-white text-ink/80 hover:border-ink/25"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </SubtleHorizontalScroll>
        </div>
      ) : null}

      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
          {activeSeries?.name ?? t("filterAll")}
        </p>
        <p className="mt-2 text-sm text-muted">● {countLabel}</p>
      </div>

      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {displayProducts.map((p, i) => (
            <ProductCard
              key={p.slug}
              product={p}
              cardImageUrl={cardImagesBySlug[p.slug]}
              cardHoverImageUrl={cardHoverImagesBySlug[p.slug]}
              imagePriority={i < 2}
              imageEager={i < 4}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-line bg-paper/50 px-4 py-10 text-center text-sm text-muted">
          {searchQuery.trim()
            ? t("searchNoResults", { query: searchQuery.trim() })
            : activeSeries
              ? t("filterNoResults", { filter: activeSeries.name })
              : t("emptyCategory")}{" "}
          {(searchQuery.trim() || activeSeries) && (
            <Link href={WATCHES_PATH} className="underline underline-offset-4">
              {t("clearFilter")}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
