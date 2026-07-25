/** Map admin category → legacy storefront filter fields (shop URLs stay stable). */
export function legacyPlacementFromCategory(category: {
  name: string;
  slug: string;
}): {
  categoryLabel: string;
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
} {
  const slug = category.slug.trim().toLowerCase();
  if (slug === "ultra-thin") {
    return {
      categoryLabel: category.name,
      storefrontCategory: null,
      storefrontSubcategory: null,
      storefrontSeries: "ultra-thin",
    };
  }
  if (slug === "quartz" || slug === "mechanical") {
    return {
      categoryLabel: category.name,
      storefrontCategory: slug,
      storefrontSubcategory: null,
      storefrontSeries: null,
    };
  }
  return {
    categoryLabel: category.name,
    storefrontCategory: null,
    storefrontSubcategory: null,
    storefrontSeries: null,
  };
}

/** Storefront PRODUCTS menu / shop link for a category id (All → `/product`). */
export function shopCategoryHref(categoryId: string | null | undefined): string {
  const id = categoryId?.trim();
  if (!id) return "/product";
  return `/product?category=${encodeURIComponent(id)}`;
}

/** @deprecated Prefer `shopCategoryHref(categoryId)`. */
export function shopHrefForCategorySlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (s === "quartz") return "/product?movement=quartz";
  if (s === "mechanical") return "/product?movement=mechanical";
  if (s === "ultra-thin") return "/product?profile=ultra-thin";
  return `/product?category=${encodeURIComponent(s)}`;
}
