"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductVariantOption } from "@/lib/catalog";
import {
  styleNumFromR2VariantUrl,
} from "@/lib/r2-line-image";

type ProductPdpGallerySyncContextValue = {
  galleryIndex: number;
  variantHeroSrc: string | null;
  setGalleryIndex: (index: number) => void;
  syncGalleryToVariant: (variantIndex: number) => void;
};

const ProductPdpGallerySyncContext =
  createContext<ProductPdpGallerySyncContextValue | null>(null);

function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, "https://placeholder.local");
    return parsed.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

function findGalleryIndexForVariant(
  option: ProductVariantOption | undefined,
  gallerySlides: string[],
): number {
  const img = option?.image?.trim();
  if (!img) return -1;

  const target = normalizeImageUrl(img);
  const byUrl = gallerySlides.findIndex((slide) => normalizeImageUrl(slide) === target);
  if (byUrl >= 0) return byUrl;

  const variantStyleNum = styleNumFromR2VariantUrl(img);
  if (variantStyleNum != null) {
    const byStyleNum = gallerySlides.findIndex((slide) => {
      if (!slide.includes("/variants/")) return false;
      return styleNumFromR2VariantUrl(slide) === variantStyleNum;
    });
    if (byStyleNum >= 0) return byStyleNum;
  }

  return -1;
}

export function ProductPdpGallerySyncProvider({
  gallerySlides,
  variantOptions,
  children,
}: {
  gallerySlides: string[];
  variantOptions?: ProductVariantOption[] | null;
  children: ReactNode;
}) {
  const [galleryIndex, setGalleryIndexState] = useState(0);
  const [variantHeroSrc, setVariantHeroSrc] = useState<string | null>(null);
  const options = variantOptions ?? [];

  const setGalleryIndex = useCallback((index: number) => {
    setVariantHeroSrc(null);
    setGalleryIndexState(index);
  }, []);

  const syncGalleryToVariant = useCallback(
    (variantIndex: number) => {
      const option = options[variantIndex];
      const img = option?.image?.trim();
      if (!img) return;

      const idx = findGalleryIndexForVariant(option, gallerySlides);
      if (idx >= 0) {
        setVariantHeroSrc(null);
        setGalleryIndexState(idx);
        return;
      }

      setVariantHeroSrc(img);
      setGalleryIndexState(0);
    },
    [gallerySlides, options],
  );

  const value = useMemo(
    () => ({ galleryIndex, variantHeroSrc, setGalleryIndex, syncGalleryToVariant }),
    [galleryIndex, variantHeroSrc, setGalleryIndex, syncGalleryToVariant],
  );

  return (
    <ProductPdpGallerySyncContext.Provider value={value}>
      {children}
    </ProductPdpGallerySyncContext.Provider>
  );
}

export function useProductPdpGallerySync(): ProductPdpGallerySyncContextValue | null {
  return useContext(ProductPdpGallerySyncContext);
}
