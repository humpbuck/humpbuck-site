"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product } from "@/lib/catalog";
import { shopCategoryHref } from "@/lib/product-category-shared";

export type ShopCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

function normalizeSearchQuery(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

function resolveActiveCategory(
  categories: ShopCategoryOption[],
  searchParams: URLSearchParams,
): ShopCategoryOption | null {
  const categoryParam = searchParams.get("category")?.trim() || "";
  if (categoryParam) {
    const byId = categories.find((c) => c.id === categoryParam);
    if (byId) return byId;
    const bySlug = categories.find(
      (c) => c.slug.toLowerCase() === categoryParam.toLowerCase(),
    );
    if (bySlug) return bySlug;
  }

  const movement = searchParams.get("movement")?.trim().toLowerCase() || "";
  if (movement === "quartz" || movement === "mechanical") {
    return categories.find((c) => c.slug === movement) ?? null;
  }

  const profile = searchParams.get("profile")?.trim().toLowerCase() || "";
  if (profile === "ultra-thin") {
    return categories.find((c) => c.slug === "ultra-thin") ?? null;
  }

  return null;
}

export function ShopCatalogClient({
  products,
  categories,
  cardImagesBySlug,
  cardHoverImagesBySlug,
  updatedDate,
}: {
  products: Product[];
  categories: ShopCategoryOption[];
  cardImagesBySlug: Record<string, string>;
  cardHoverImagesBySlug: Record<string, string>;
  updatedDate: string;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = useMemo(
    () => resolveActiveCategory(categories, searchParams),
    [categories, searchParams],
  );

  const displayProducts = useMemo(() => {
    let list = products;
    if (activeCategory) {
      list = list.filter((p) => p.categoryId === activeCategory.id);
    }
    const q = normalizeSearchQuery(searchQuery);
    if (!q) return list;
    return list.filter((p) => {
      const slug = p.slug.toLowerCase();
      const name = p.name.trim().toLowerCase().replace(/\s+/g, "-");
      return slug.includes(q) || name.includes(q);
    });
  }, [products, searchQuery, activeCategory]);

  const selectCategory = useCallback(
    (id: string | null) => {
      router.push(shopCategoryHref(id));
    },
    [router],
  );

  const countLabel = searchQuery.trim()
    ? t("searchMatchCount", {
        count: displayProducts.length,
        query: searchQuery.trim(),
      })
    : activeCategory
      ? t("filterMatchCount", {
          count: displayProducts.length,
          filter: activeCategory.name,
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
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            role="listbox"
            aria-label={t("filterCategories")}
          >
            <button
              type="button"
              role="option"
              aria-selected={!activeCategory}
              onClick={() => selectCategory(null)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                !activeCategory
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white text-ink/80 hover:border-ink/25"
              }`}
            >
              {t("filterAll")}
            </button>
            {categories.map((category) => {
              const selected = activeCategory?.id === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectCategory(category.id)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                    selected
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-white text-ink/80 hover:border-ink/25"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
          {activeCategory?.name ?? t("filterAll")}
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
            : activeCategory
              ? t("filterNoResults", { filter: activeCategory.name })
              : t("emptyCategory")}{" "}
          {(searchQuery.trim() || activeCategory) && (
            <Link href="/product" className="underline underline-offset-4">
              {t("clearFilter")}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
