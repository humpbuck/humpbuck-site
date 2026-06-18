"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  STOREFRONT_CATEGORY_LABELS,
  STOREFRONT_CATEGORY_SLUGS,
  STOREFRONT_SERIES_KEYS,
  STOREFRONT_SERIES_LABELS,
  STOREFRONT_SUBCATEGORY_KEYS,
  STOREFRONT_SUBCATEGORY_LABELS,
  categoryHasSubcategories,
  coalesceStorefrontPlacementFields,
  normalizeStorefrontCategoryInput,
  normalizeStorefrontSubcategoryInput,
  normalizeStorefrontSeriesInput,
  type StorefrontCategorySlug,
} from "@/lib/home-watch-sections";

export type SidebarListedProduct = {
  selectionKey: string;
  slug: string;
  name: string;
  storefrontCategory: string;
  storefrontSubcategory: string;
  storefrontSeries: string;
};

const STANDARD_SERIES_KEY = "__standard__";

function compareProductsByName(a: SidebarListedProduct, b: SidebarListedProduct): number {
  const aName = a.name.trim() || a.slug.trim();
  const bName = b.name.trim() || b.slug.trim();
  return aName.localeCompare(bName, undefined, { sensitivity: "base" });
}

function seriesBucketKey(series: string | null): string {
  return series ?? STANDARD_SERIES_KEY;
}

function seriesBucketLabel(seriesKey: string): string {
  if (seriesKey === STANDARD_SERIES_KEY) return "Standard";
  const series = normalizeStorefrontSeriesInput(seriesKey);
  return series ? STOREFRONT_SERIES_LABELS[series] : "Standard";
}

function groupProductsForSidebar(products: SidebarListedProduct[]) {
  const unassigned: SidebarListedProduct[] = [];
  const byCategorySubSeries = STOREFRONT_CATEGORY_SLUGS.reduce<
    Record<StorefrontCategorySlug, Record<string, Record<string, SidebarListedProduct[]>>>
  >((acc, category) => {
    acc[category] = STOREFRONT_SUBCATEGORY_KEYS.reduce<
      Record<string, Record<string, SidebarListedProduct[]>>
    >((subAcc, subKey) => {
      subAcc[subKey] = {
        [STANDARD_SERIES_KEY]: [],
        ...Object.fromEntries(STOREFRONT_SERIES_KEYS.map((seriesKey) => [seriesKey, []])),
      };
      return subAcc;
    }, {});
    return acc;
  }, {} as Record<StorefrontCategorySlug, Record<string, Record<string, SidebarListedProduct[]>>>);

  for (const item of products) {
    const placement = coalesceStorefrontPlacementFields(item);
    const category = normalizeStorefrontCategoryInput(placement.storefrontCategory);
    const subcategory = category
      ? normalizeStorefrontSubcategoryInput(placement.storefrontSubcategory)
      : null;
    const series = normalizeStorefrontSeriesInput(placement.storefrontSeries);

    if (category && subcategory && categoryHasSubcategories(category)) {
      const bucket = seriesBucketKey(series);
      byCategorySubSeries[category][subcategory][bucket]?.push(item);
      continue;
    }
    unassigned.push(item);
  }

  for (const category of STOREFRONT_CATEGORY_SLUGS) {
    for (const subKey of STOREFRONT_SUBCATEGORY_KEYS) {
      for (const bucket of Object.keys(byCategorySubSeries[category][subKey])) {
        byCategorySubSeries[category][subKey][bucket].sort(compareProductsByName);
      }
    }
  }
  unassigned.sort(compareProductsByName);

  return { byCategorySubSeries, unassigned };
}

export function AdminProductSidebar({
  products,
  selected,
  onSelect,
}: {
  products: SidebarListedProduct[];
  selected: string | null;
  onSelect: (selectionKey: string) => void;
}) {
  const grouped = useMemo(() => groupProductsForSidebar(products), [products]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => new Set());
  const [collapsedSubcategories, setCollapsedSubcategories] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedSeries, setCollapsedSeries] = useState<Set<string>>(() => new Set());

  const selectedProduct = useMemo(
    () => products.find((item) => item.selectionKey === selected) ?? null,
    [products, selected],
  );

  useEffect(() => {
    if (!selectedProduct) return;
    const placement = coalesceStorefrontPlacementFields(selectedProduct);
    const category = normalizeStorefrontCategoryInput(placement.storefrontCategory);
    const subcategory = category
      ? normalizeStorefrontSubcategoryInput(placement.storefrontSubcategory)
      : null;
    const series = normalizeStorefrontSeriesInput(placement.storefrontSeries);

    if (category && subcategory) {
      const seriesKey = seriesBucketKey(series);
      setCollapsedCategories((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
      });
      setCollapsedSubcategories((prev) => {
        const next = new Set(prev);
        next.delete(`${category}:${subcategory}`);
        return next;
      });
      setCollapsedSeries((prev) => {
        const next = new Set(prev);
        next.delete(`${category}:${subcategory}:${seriesKey}`);
        return next;
      });
      return;
    }

    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.delete("__unassigned__");
      return next;
    });
  }, [
    selectedProduct?.storefrontCategory,
    selectedProduct?.storefrontSubcategory,
    selectedProduct?.storefrontSeries,
  ]);

  function toggleCategory(category: StorefrontCategorySlug) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function toggleSubcategory(category: StorefrontCategorySlug, subKey: string) {
    const key = `${category}:${subKey}`;
    setCollapsedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSeries(category: StorefrontCategorySlug, subKey: string, seriesKey: string) {
    const key = `${category}:${subKey}:${seriesKey}`;
    setCollapsedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderProductButton(item: SidebarListedProduct) {
    const active = item.selectionKey === selected;
    return (
      <button
        type="button"
        key={item.selectionKey}
        onClick={() => onSelect(item.selectionKey)}
        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
          active
            ? "border-ink/30 bg-white"
            : "border-line/80 bg-white/60 hover:border-ink/15"
        }`}
      >
        <p className="truncate text-xs font-semibold text-ink">
          {item.name || "(New product)"}
        </p>
        <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.12em] text-muted">
          {item.slug || "draft-slug"}
        </p>
      </button>
    );
  }

  if (products.length === 0) {
    return <p className="text-xs text-muted">No products yet. Click Add.</p>;
  }

  return (
    <div className="max-h-[min(72vh,720px)] space-y-2 overflow-y-auto pr-1">
      {STOREFRONT_CATEGORY_SLUGS.map((category) => {
        const subMap = grouped.byCategorySubSeries[category];
        const categoryCount = Object.values(subMap).reduce(
          (sum, seriesMap) =>
            sum + Object.values(seriesMap).reduce((inner, items) => inner + items.length, 0),
          0,
        );
        const categoryExpanded = !collapsedCategories.has(category);

        return (
          <div key={category} className="rounded-xl border border-line/80 bg-white/40">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              aria-expanded={categoryExpanded}
            >
              <ChevronDown
                size={14}
                className={`shrink-0 text-muted transition ${categoryExpanded ? "rotate-180" : ""}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-ink/80">
                {STOREFRONT_CATEGORY_LABELS[category]}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-muted">
                {categoryCount}
              </span>
            </button>

            {categoryExpanded ? (
              <div className="space-y-1.5 border-t border-line/70 px-2 py-2">
                {STOREFRONT_SUBCATEGORY_KEYS.map((subKey) => {
                  const seriesMap = subMap[subKey];
                  const subCount = Object.values(seriesMap).reduce(
                    (sum, items) => sum + items.length,
                    0,
                  );
                  const subExpanded = !collapsedSubcategories.has(`${category}:${subKey}`);
                  const seriesBuckets = [
                    STANDARD_SERIES_KEY,
                    ...STOREFRONT_SERIES_KEYS,
                  ] as const;

                  return (
                    <div key={`${category}-${subKey}`} className="rounded-lg bg-paper/30">
                      <button
                        type="button"
                        onClick={() => toggleSubcategory(category, subKey)}
                        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
                        aria-expanded={subExpanded}
                      >
                        <ChevronDown
                          size={12}
                          className={`shrink-0 text-muted transition ${subExpanded ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink/75">
                          {STOREFRONT_SUBCATEGORY_LABELS[subKey]}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted">
                          {subCount}
                        </span>
                      </button>

                      {subExpanded ? (
                        <div className="space-y-1.5 px-2 pb-2">
                          {seriesBuckets.map((seriesKey) => {
                            const items = seriesMap[seriesKey] ?? [];
                            const seriesExpanded = !collapsedSeries.has(
                              `${category}:${subKey}:${seriesKey}`,
                            );

                            return (
                              <div
                                key={`${category}-${subKey}-${seriesKey}`}
                                className="rounded-md border border-line/60 bg-white/40"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSeries(category, subKey, seriesKey)}
                                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
                                  aria-expanded={seriesExpanded}
                                >
                                  <ChevronDown
                                    size={11}
                                    className={`shrink-0 text-muted transition ${seriesExpanded ? "rotate-180" : ""}`}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-ink/70">
                                    {seriesBucketLabel(seriesKey)}
                                  </span>
                                  <span className="shrink-0 text-[10px] tabular-nums text-muted">
                                    {items.length}
                                  </span>
                                </button>

                                {seriesExpanded ? (
                                  <div className="space-y-1.5 px-2 pb-2">
                                    {items.length > 0 ? (
                                      items.map((item) => renderProductButton(item))
                                    ) : (
                                      <p className="px-1 py-1 text-[10px] text-muted">
                                        No products yet
                                      </p>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      {grouped.unassigned.length > 0 ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40">
          <button
            type="button"
            onClick={() =>
              setCollapsedCategories((prev) => {
                const next = new Set(prev);
                if (next.has("__unassigned__")) next.delete("__unassigned__");
                else next.add("__unassigned__");
                return next;
              })
            }
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            aria-expanded={!collapsedCategories.has("__unassigned__")}
          >
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition ${
                collapsedCategories.has("__unassigned__") ? "" : "rotate-180"
              }`}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-amber-900/80">
              Unassigned
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-muted">
              {grouped.unassigned.length}
            </span>
          </button>

          {!collapsedCategories.has("__unassigned__") ? (
            <div className="space-y-1.5 border-t border-amber-200/70 px-2 py-2">
              {grouped.unassigned.map((item) => renderProductButton(item))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
