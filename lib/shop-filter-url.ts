import type {
  ShopAudienceFilter,
  ShopMovementFilter,
  ShopProfileFilter,
} from "@/lib/catalog";

export type ShopCatalogFilterParams = {
  series?: string | null;
  movement?: ShopMovementFilter | null;
  audience?: ShopAudienceFilter | null;
  profile?: ShopProfileFilter | null;
};

export function buildShopCatalogHref(params: ShopCatalogFilterParams): string {
  const sp = new URLSearchParams();
  const series = params.series?.trim();
  if (series) sp.set("series", series);
  if (params.movement) sp.set("movement", params.movement);
  if (params.audience) sp.set("audience", params.audience);
  if (params.profile) sp.set("profile", params.profile);
  const q = sp.toString();
  return q ? `/product?${q}` : "/product";
}

export function shopCatalogFiltersActive(params: ShopCatalogFilterParams): boolean {
  return Boolean(
    params.series?.trim() ||
      params.movement ||
      params.audience ||
      params.profile,
  );
}

export function toggleShopCatalogFilter(
  current: ShopCatalogFilterParams,
  key: keyof ShopCatalogFilterParams,
  value: string | null,
): string {
  const next: ShopCatalogFilterParams = { ...current };
  if (key === "series") {
    next.series = current.series === value ? null : value;
  } else if (key === "movement") {
    next.movement =
      current.movement === value ? null : (value as ShopMovementFilter | null);
  } else if (key === "audience") {
    next.audience =
      current.audience === value ? null : (value as ShopAudienceFilter | null);
  } else if (key === "profile") {
    next.profile =
      current.profile === value ? null : (value as ShopProfileFilter | null);
  }
  return buildShopCatalogHref(next);
}

export function patchShopCatalogHref(
  current: ShopCatalogFilterParams,
  patch: Partial<ShopCatalogFilterParams>,
): string {
  return buildShopCatalogHref({ ...current, ...patch });
}

/** UI “Series” sub-select: DIGI-TEMP slug vs ultra-thin profile flag. */
export type ShopSeriesUiValue = string;

export function readShopSeriesUiValue(
  filters: ShopCatalogFilterParams,
): ShopSeriesUiValue {
  if (filters.profile === "ultra-thin") return "ultra-thin";
  return filters.series?.trim() ?? "";
}

export function applyShopSeriesUiValue(
  current: ShopCatalogFilterParams,
  value: ShopSeriesUiValue,
): ShopCatalogFilterParams {
  if (!value) {
    return { ...current, series: null, profile: null };
  }
  if (value === "ultra-thin") {
    return { ...current, series: null, profile: "ultra-thin" };
  }
  return { ...current, series: value, profile: null };
}

export type ShopPrimaryCategory = "" | "movement" | "audience" | "series";

const EMPTY_SHOP_FILTERS: ShopCatalogFilterParams = {
  series: null,
  movement: null,
  audience: null,
  profile: null,
};

/** Which top-level shop filter is active (only one dimension at a time in the UI). */
export function readShopPrimaryCategory(
  filters: ShopCatalogFilterParams,
): ShopPrimaryCategory {
  if (filters.movement) return "movement";
  if (filters.audience) return "audience";
  if (filters.series?.trim() || filters.profile === "ultra-thin") return "series";
  return "";
}

export function readShopSubValue(
  filters: ShopCatalogFilterParams,
  category: ShopPrimaryCategory,
): string {
  if (category === "movement") return filters.movement ?? "";
  if (category === "audience") return filters.audience ?? "";
  if (category === "series") return readShopSeriesUiValue(filters);
  return "";
}

/** Apply primary + sub selection; clears other filter dimensions. */
export function buildShopCatalogPrimarySelection(
  category: ShopPrimaryCategory,
  subValue: string,
): ShopCatalogFilterParams {
  if (!category) return { ...EMPTY_SHOP_FILTERS };
  if (!subValue) return { ...EMPTY_SHOP_FILTERS };

  if (category === "movement") {
    return {
      ...EMPTY_SHOP_FILTERS,
      movement: subValue as ShopMovementFilter,
    };
  }
  if (category === "audience") {
    return {
      ...EMPTY_SHOP_FILTERS,
      audience: subValue as ShopAudienceFilter,
    };
  }
  return applyShopSeriesUiValue({ ...EMPTY_SHOP_FILTERS }, subValue);
}

export function defaultShopSubValue(
  category: ShopPrimaryCategory,
  seriesSlugs: string[],
): string {
  if (category === "movement") return "mechanical";
  if (category === "audience") return "men";
  if (category === "series") return seriesSlugs[0] ?? "ultra-thin";
  return "";
}
