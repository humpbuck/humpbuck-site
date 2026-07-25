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

/** Card tile baseline: prefer explicit card URLs; else gallery[0]/[1]. */
export function resolveProductCardDisplayImages(
  product: {
    image: string;
    galleryImages?: string[];
    images?: string[];
  },
  cardImageUrl?: string,
  cardHoverImageUrl?: string,
): { primarySrc: string; hoverSrc?: string } {
  const cover = cardImageUrl?.trim();
  const hover = cardHoverImageUrl?.trim();
  if (cover) {
    return { primarySrc: cover, hoverSrc: hover || undefined };
  }
  const fromGallery = resolveShopCardImagesFromGallery(
    product.galleryImages ?? product.images,
  );
  return {
    primarySrc: fromGallery.cover?.trim() || product.image.trim(),
    hoverSrc: hover || fromGallery.hover?.trim() || undefined,
  };
}
