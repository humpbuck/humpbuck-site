"use client";

import { ProductImageCarousel } from "@/components/site/ProductImageCarousel";
import { useProductPdpGallerySync } from "@/components/site/product-pdp-gallery-sync";

export function ProductPdpSyncedCarousel({
  alt,
  images,
  themeGlowClass,
}: {
  alt: string;
  images: string[];
  themeGlowClass: string;
}) {
  const sync = useProductPdpGallerySync();

  if (!sync) {
    return (
      <ProductImageCarousel alt={alt} images={images} themeGlowClass={themeGlowClass} />
    );
  }

  return (
    <ProductImageCarousel
      alt={alt}
      images={images}
      themeGlowClass={themeGlowClass}
      activeIndex={sync.galleryIndex}
      onActiveIndexChange={sync.setGalleryIndex}
      activeSlideOverride={sync.variantHeroSrc}
    />
  );
}
