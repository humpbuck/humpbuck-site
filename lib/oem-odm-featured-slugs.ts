export type OemOdmFeaturedModelSeed = {
  /** Canonical PDP slug */
  slug: string;
  /** Alternate slugs in catalog (e.g. digitemp-2301) */
  slugAliases?: string[];
  name: string;
  image: string;
};

/** Always show these five on `/oem-odm`; merge with catalog when present. */
export const OEM_ODM_FEATURED_MODEL_SEEDS: OemOdmFeaturedModelSeed[] = [
  {
    slug: "digi-temp-2301",
    slugAliases: ["digitemp-2301"],
    name: "DIGI-TEMP 2301",
    image:
      "https://assets.humpbuck.com/Products/humpbuck-2301/HUMPBUCK-2301-gallery-01.webp",
  },
  {
    slug: "2302",
    name: "HUMPBUCK 2302",
    image:
      "https://assets.humpbuck.com/Products/humpbuck-2302/2302-color-grey-02-800X800.webp",
  },
  {
    slug: "2303",
    name: "HUMPBUCK 2303",
    image:
      "https://assets.humpbuck.com/Products/humpbuck-2303/2303-main-02-800X800.webp",
  },
  {
    slug: "2304",
    name: "HUMPBUCK 2304",
    image:
      "https://assets.humpbuck.com/Products/humpbuck-2304/humpbuck-2304-gallery-01.webp",
  },
  {
    slug: "2411m",
    name: "HUMPBUCK 2411M",
    image:
      "https://assets.humpbuck.com/Products/humpbuck-2411M/humpbuck-2411M-gallery-01.webp",
  },
];

export type OemOdmFeaturedModel = {
  slug: string;
  name: string;
  image: string;
};

type CatalogLike = {
  slug: string;
  name: string;
  image: string;
};

function findCatalogMatch(
  seed: OemOdmFeaturedModelSeed,
  catalogBySlug: Map<string, CatalogLike>,
): CatalogLike | undefined {
  const candidates = [seed.slug, ...(seed.slugAliases ?? [])];
  for (const slug of candidates) {
    const hit = catalogBySlug.get(slug);
    if (hit) return hit;
  }
  return undefined;
}

/** Resolve featured cards — catalog wins for name/image when available. */
export function resolveOemOdmFeaturedModels(
  catalog: CatalogLike[],
): OemOdmFeaturedModel[] {
  const catalogBySlug = new Map(catalog.map((p) => [p.slug, p]));
  return OEM_ODM_FEATURED_MODEL_SEEDS.map((seed) => {
    const fromDb = findCatalogMatch(seed, catalogBySlug);
    return {
      slug: fromDb?.slug ?? seed.slug,
      name: fromDb?.name?.trim() || seed.name,
      image: fromDb?.image?.trim() || seed.image,
    };
  });
}

/** @deprecated Use {@link OEM_ODM_FEATURED_MODEL_SEEDS} slugs */
export const OEM_ODM_FEATURED_PRODUCT_SLUGS = OEM_ODM_FEATURED_MODEL_SEEDS.map(
  (m) => m.slug,
) as readonly string[];
