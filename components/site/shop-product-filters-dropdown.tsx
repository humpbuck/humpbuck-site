"use client";

import { useRouter } from "@/i18n/navigation";
import {
  buildShopCatalogHref,
  buildShopCatalogPrimarySelection,
  defaultShopSubValue,
  readShopPrimaryCategory,
  readShopSubValue,
  shopCatalogFiltersActive,
  type ShopCatalogFilterParams,
  type ShopPrimaryCategory,
} from "@/lib/shop-filter-url";

type FilterLabels = {
  filterAll: string;
  filterGroupMovement: string;
  filterGroupAudience: string;
  filterGroupSeries: string;
  filterMechanical: string;
  filterQuartz: string;
  filterMen: string;
  filterWomen: string;
  filterUltraThin: string;
  filterClearAll: string;
  filterSelectCategory: string;
  filterSelectSub: string;
};

const selectClass =
  "rounded-full border border-line bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink outline-none ring-ink/20 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-45 sm:text-[11px]";

function subOptionsForCategory(
  category: ShopPrimaryCategory,
  seriesOptions: Array<{ slug: string; label: string }>,
  labels: FilterLabels,
): Array<{ value: string; label: string }> {
  if (category === "movement") {
    return [
      { value: "mechanical", label: labels.filterMechanical },
      { value: "quartz", label: labels.filterQuartz },
    ];
  }
  if (category === "audience") {
    return [
      { value: "men", label: labels.filterMen },
      { value: "women", label: labels.filterWomen },
    ];
  }
  if (category === "series") {
    return [
      ...seriesOptions.map((s) => ({ value: s.slug, label: s.label })),
      { value: "ultra-thin", label: labels.filterUltraThin },
    ];
  }
  return [];
}

export function ShopProductFiltersDropdown({
  filters,
  seriesOptions,
  labels,
}: {
  filters: ShopCatalogFilterParams;
  seriesOptions: Array<{ slug: string; label: string }>;
  labels: FilterLabels;
}) {
  const router = useRouter();
  const seriesSlugs = seriesOptions.map((s) => s.slug);
  const primaryCategory = readShopPrimaryCategory(filters);
  const subValue = readShopSubValue(filters, primaryCategory);
  const hasActive = shopCatalogFiltersActive(filters);
  const subOptions = subOptionsForCategory(primaryCategory, seriesOptions, labels);

  const primaryOptions: Array<{ value: ShopPrimaryCategory; label: string }> = [
    { value: "", label: labels.filterAll },
    { value: "movement", label: labels.filterGroupMovement },
    { value: "audience", label: labels.filterGroupAudience },
    { value: "series", label: labels.filterGroupSeries },
  ];

  const navigateSelection = (category: ShopPrimaryCategory, sub: string) => {
    router.push(
      buildShopCatalogHref(buildShopCatalogPrimarySelection(category, sub)),
    );
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
      <select
        aria-label={labels.filterSelectCategory}
        value={primaryCategory}
        onChange={(e) => {
          const category = e.target.value as ShopPrimaryCategory;
          if (!category) {
            router.push("/product");
            return;
          }
          const sub = defaultShopSubValue(category, seriesSlugs);
          if (!sub) return;
          navigateSelection(category, sub);
        }}
        className={selectClass}
      >
        {primaryOptions.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {primaryCategory ? (
        <select
          aria-label={labels.filterSelectSub}
          value={subValue}
          onChange={(e) => {
            const next = e.target.value;
            if (!next) return;
            navigateSelection(primaryCategory, next);
          }}
          className={selectClass}
        >
          {subOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}

      {hasActive ? (
        <button
          type="button"
          onClick={() => router.push("/product")}
          className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted underline-offset-4 transition hover:text-ink hover:underline sm:ml-1 sm:text-[10px]"
        >
          {labels.filterClearAll}
        </button>
      ) : null}
    </div>
  );
}
