import { getTranslations } from "next-intl/server";
import { ShopProductFiltersDropdown } from "@/components/site/shop-product-filters-dropdown";
import type { ShopCatalogFilterParams } from "@/lib/shop-filter-url";

export async function ShopProductFilters({
  filters,
  seriesOptions,
}: {
  filters: ShopCatalogFilterParams;
  seriesOptions: Array<{ slug: string; label: string }>;
}) {
  const t = await getTranslations("Shop");

  return (
    <ShopProductFiltersDropdown
      filters={filters}
      seriesOptions={seriesOptions}
      labels={{
        filterAll: t("filterAll"),
        filterGroupMovement: t("filterGroupMovement"),
        filterGroupAudience: t("filterGroupAudience"),
        filterGroupSeries: t("filterGroupSeries"),
        filterMechanical: t("filterMechanical"),
        filterQuartz: t("filterQuartz"),
        filterMen: t("filterMen"),
        filterWomen: t("filterWomen"),
        filterUltraThin: t("filterUltraThin"),
        filterClearAll: t("filterClearAll"),
        filterSelectCategory: t("filterSelectCategory"),
        filterSelectSub: t("filterSelectSub"),
      }}
    />
  );
}
