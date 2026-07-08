import { cache } from "react";
import { R2_GALLERY_SPECS_BY_SLUG } from "@/lib/r2";
import { getPdpR2Media } from "@/lib/r2-pdp-media";
import {
  resolveShopCardImagesFromGallery,
  type ShopCardImagePair,
} from "@/lib/r2-card-image-resolve";

export type { ShopCardImagePair } from "@/lib/r2-card-image-resolve";
export { resolveProductCardDisplayImages, resolveShopCardImagesFromGallery } from "@/lib/r2-card-image-resolve";

function galleryUrls(urls: string[] | undefined): string[] {
  return (urls ?? []).map((u) => u.trim()).filter(Boolean);
}

/**
 * Shop card images from gallery only: first image default, second on hover.
 * Falls back to R2 bucket discovery when gallery is empty in the catalog.
 */
export const getShopCardImages = cache(
  async (
    productSlug: string,
    _catalogImage?: string,
    catalogGallery?: string[],
  ): Promise<ShopCardImagePair> => {
    const galleryAdmin = galleryUrls(catalogGallery);
    if (galleryAdmin.length > 0) {
      return resolveShopCardImagesFromGallery(galleryAdmin);
    }

    const spec = R2_GALLERY_SPECS_BY_SLUG[productSlug];
    if (!spec) return { cover: null, hover: null };

    const pdp = await getPdpR2Media(spec);
    return resolveShopCardImagesFromGallery(pdp.gallery ?? undefined);
  },
);

export const getShopCardR2GalleryImage = cache(
  async (
    productSlug: string,
    catalogImage?: string,
    catalogGallery?: string[],
  ): Promise<string | null> => {
    const { cover } = await getShopCardImages(productSlug, catalogImage, catalogGallery);
    return cover;
  },
);

export async function mapProductsToShopCardImages(
  products: Array<{
    slug: string;
    image: string;
    galleryImages?: string[];
    images?: string[];
  }>,
): Promise<{ covers: (string | undefined)[]; hovers: (string | undefined)[] }> {
  const pairs = await Promise.all(
    products.map((p) =>
      getShopCardImages(p.slug, p.image, p.galleryImages ?? p.images),
    ),
  );
  return {
    covers: pairs.map((p) => p.cover ?? undefined),
    hovers: pairs.map((p) => p.hover ?? undefined),
  };
}
