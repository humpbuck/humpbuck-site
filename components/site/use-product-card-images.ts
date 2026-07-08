"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariantOption } from "@/lib/catalog";
import { resolveProductCardDisplayImages } from "@/lib/r2-card-image-resolve";

function useVariantGalleryCardImages(
  galleryPrimary: string,
  galleryHover: string | undefined,
  variants: ProductVariantOption[],
) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [variantPicked, setVariantPicked] = useState(false);

  const variantImage = variants[variantIndex]?.image?.trim();
  const primarySrc =
    variantPicked && variantImage ? variantImage : galleryPrimary;
  const hoverSrc = variantPicked ? undefined : galleryHover;

  function onVariantIndexChange(index: number) {
    setVariantIndex(index);
    setVariantPicked(true);
  }

  return {
    variants,
    variantIndex,
    onVariantIndexChange,
    primarySrc,
    hoverSrc,
  };
}

/** Shop/home cards: gallery[0] default, gallery[1] hover, variant image after swatch click. */
export function useProductCardImages(
  product: Product,
  cardImageUrl?: string,
  cardHoverImageUrl?: string,
) {
  const gallery = useMemo(
    () => resolveProductCardDisplayImages(product, cardImageUrl, cardHoverImageUrl),
    [product, cardImageUrl, cardHoverImageUrl],
  );
  return useVariantGalleryCardImages(
    gallery.primarySrc,
    gallery.hoverSrc,
    product.variantOptions ?? [],
  );
}

/** Hero spotlights with variant swatches — same default/hover/variant rules. */
export function useSpotlightCardImages(
  galleryPrimary: string,
  galleryHover: string | undefined,
  variantOptions: ProductVariantOption[],
) {
  return useVariantGalleryCardImages(galleryPrimary, galleryHover, variantOptions);
}
