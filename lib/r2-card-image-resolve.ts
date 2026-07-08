export type ShopCardImagePair = {
  cover: string | null;
  hover: string | null;
};

function galleryUrls(urls: string[] | undefined): string[] {
  return (urls ?? []).map((u) => u.trim()).filter(Boolean);
}

/** Shop card: gallery[0] default, gallery[1] on hover. */
export function resolveShopCardImagesFromGallery(
  catalogGallery?: string[],
): ShopCardImagePair {
  const gallery = galleryUrls(catalogGallery);
  return {
    cover: gallery[0] ?? null,
    hover: gallery[1] ?? null,
  };
}

/** Card tile baseline: gallery first image default, second on hover. */
export function resolveProductCardDisplayImages(
  product: {
    image: string;
    galleryImages?: string[];
    images?: string[];
  },
  cardImageUrl?: string,
  cardHoverImageUrl?: string,
): { primarySrc: string; hoverSrc?: string } {
  const fromGallery = resolveShopCardImagesFromGallery(
    product.galleryImages ?? product.images,
  );
  const primarySrc =
    cardImageUrl?.trim() || fromGallery.cover?.trim() || product.image.trim();
  const hoverSrc =
    cardHoverImageUrl?.trim() || fromGallery.hover?.trim() || undefined;
  return { primarySrc, hoverSrc };
}
