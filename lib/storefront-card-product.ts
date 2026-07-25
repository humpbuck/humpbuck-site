import type { Product } from "@/lib/catalog";

/**
 * Strip PDP-only media from a catalog product before crossing the RSC → client
 * boundary for storefront cards (home grids / recommended / shop tiles).
 *
 * Cards only need cover (+ hover via separate prop), variant swatches, and
 * pricing — not full `galleryImages` / detail / promo payloads.
 */
export function toStorefrontCardProduct(
  product: Product,
  cover?: string | null,
): Product {
  const image = cover?.trim() || product.image.trim();
  return {
    slug: product.slug,
    name: product.name,
    seriesSlug: product.seriesSlug,
    categoryLabel: product.categoryLabel,
    shortDescription: "",
    description: "",
    price: product.price,
    ...(product.compareAtPrice != null
      ? { compareAtPrice: product.compareAtPrice }
      : {}),
    image,
    images: [],
    ...(product.variantOptions?.length
      ? { variantOptions: product.variantOptions }
      : {}),
    highlights: [],
    specs: [],
    inStock: product.inStock,
    ...(product.categoryId ? { categoryId: product.categoryId } : {}),
  };
}

export function mapToStorefrontCardProducts(
  products: Product[],
  covers: (string | undefined | null)[],
): Product[] {
  return products.map((product, i) =>
    toStorefrontCardProduct(product, covers[i]),
  );
}
