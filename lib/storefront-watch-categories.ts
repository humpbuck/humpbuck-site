/**
 * Fixed storefront watch collections — structural only.
 * Localized SEO/copy lives in messages `WatchCollections` (see lib/watch-collection-copy.ts).
 */

export const WATCHES_PATH = "/watches" as const;

export type StorefrontWatchCategorySlug =
  | "ana-digi"
  | "digital"
  | "analog"
  | "automatic";

/** Message key under WatchCollections for a category slug. */
export type WatchCollectionMessageKey =
  | "all"
  | "anaDigi"
  | "digital"
  | "analog"
  | "automatic";

export type StorefrontWatchCategoryDef = {
  id: string;
  slug: StorefrontWatchCategorySlug;
  path: string;
  /** Fallback English label (DB + admin). */
  name: string;
  sortOrder: number;
  messageKey: Exclude<WatchCollectionMessageKey, "all">;
};

export const STOREFRONT_WATCH_CATEGORIES: readonly StorefrontWatchCategoryDef[] =
  [
    {
      id: "cat_quartz",
      slug: "ana-digi",
      path: "/ana-digi-watches",
      name: "ANA-DIGI",
      sortOrder: 4,
      messageKey: "anaDigi",
    },
    {
      id: "cat_digital",
      slug: "digital",
      path: "/digital-watches",
      name: "Digital",
      sortOrder: 3,
      messageKey: "digital",
    },
    {
      id: "cat_analog",
      slug: "analog",
      path: "/analog-watches",
      name: "Analog",
      sortOrder: 2,
      messageKey: "analog",
    },
    {
      id: "cat_mechanical",
      slug: "automatic",
      path: "/automatic-watches",
      name: "Automatic",
      sortOrder: 1,
      messageKey: "automatic",
    },
  ];

const BY_SLUG = new Map(
  STOREFRONT_WATCH_CATEGORIES.map((c) => [c.slug, c] as const),
);
const BY_PATH = new Map(
  STOREFRONT_WATCH_CATEGORIES.map((c) => [c.path, c] as const),
);

export function getWatchCategoryBySlug(
  slug: string,
): StorefrontWatchCategoryDef | undefined {
  return BY_SLUG.get(slug as StorefrontWatchCategorySlug);
}

export function getWatchCategoryByPath(
  path: string,
): StorefrontWatchCategoryDef | undefined {
  return BY_PATH.get(path);
}

export function watchCategoryMessageKey(
  slug: string | null | undefined,
): WatchCollectionMessageKey {
  if (!slug) return "all";
  return getWatchCategoryBySlug(slug)?.messageKey ?? "all";
}

/** All public collection paths including `/watches`. */
export const STOREFRONT_WATCH_COLLECTION_PATHS = [
  WATCHES_PATH,
  ...STOREFRONT_WATCH_CATEGORIES.map((c) => c.path),
] as const;

export function isStorefrontWatchCollectionPath(pathname: string): boolean {
  const bare = pathname.replace(
    /^\/(ar|de|en|es|fr|he|hu|it|ja|ko|nl|pt|ru)(?=\/)/,
    "",
  );
  return (STOREFRONT_WATCH_COLLECTION_PATHS as readonly string[]).includes(bare);
}

/** @deprecated Use localized WatchCollections; kept for path helper. */
export const ALL_WATCHES_SEO = { path: WATCHES_PATH } as const;
