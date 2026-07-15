import type { AbstractIntlMessages } from "next-intl";
import type { Product } from "@/lib/catalog";
import type { OemInquiryProductOption } from "@/components/site/oem-inquiry-form";
import { OEM_ODM_FEATURED_MODEL_SEEDS } from "@/lib/oem-odm-featured-slugs";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";

function catalogEntryMatchesSeed(
  product: Pick<Product, "slug">,
  seed: (typeof OEM_ODM_FEATURED_MODEL_SEEDS)[number],
): boolean {
  return (
    product.slug === seed.slug ||
    (seed.slugAliases?.includes(product.slug) ?? false)
  );
}

function featuredSeedToProductStub(
  seed: (typeof OEM_ODM_FEATURED_MODEL_SEEDS)[number],
): Product {
  return {
    slug: seed.slug,
    name: seed.name,
    seriesSlug: "",
    categoryLabel: "",
    shortDescription: "",
    description: "",
    price: 0,
    image: seed.image,
    images: [seed.image],
    highlights: [],
    specs: [],
    inStock: true,
  };
}

/**
 * OEM/ODM inquiry picker — includes every catalog row (stock does not matter for
 * custom orders) plus featured model fallbacks when a slug is not in D1 yet.
 */
export function buildOemInquiryProductOptions(
  catalog: Product[],
  localeContext?: { locale: string; messages: AbstractIntlMessages },
): OemInquiryProductOption[] {
  const options: OemInquiryProductOption[] = catalog.map((p) => ({
    slug: p.slug,
    name: p.name,
    image: p.image,
    specs: p.specs,
    oemOdmPrice: p.oemOdmPrice,
  }));

  for (const seed of OEM_ODM_FEATURED_MODEL_SEEDS) {
    const alreadyListed = catalog.some((p) => catalogEntryMatchesSeed(p, seed));
    if (alreadyListed) continue;
    const localizedSeed =
      localeContext != null
        ? applyStorefrontProductLocale(
            featuredSeedToProductStub(seed),
            localeContext.locale,
            localeContext.messages,
          )
        : featuredSeedToProductStub(seed);
    options.push({
      slug: seed.slug,
      name: localizedSeed.name,
      image: seed.image,
      specs: localizedSeed.specs,
      oemOdmPrice: undefined,
    });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
