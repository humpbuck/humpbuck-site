"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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
  /** Update gallery index without clearing the STYLE hero (scroll echoes). */
  setGalleryIndex: (index: number) => void;
  /**
   * User browsed the gallery. Pass `force` for thumb/arrow clicks so the STYLE
   * pin clears even inside the post-select residual-scroll lock window.
   */
  browseGallery: (index: number, force?: boolean) => void;
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
      const file = slide.split("/").pop() ?? "";
      // Only treat style/color stills as the same style number.
      if (!/(?:style|color)-\d{1,2}\.webp$/i.test(file)) return false;
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
  /** Ignore browse-clear briefly after STYLE pin (residual scroll race). */
  const stylePinAtRef = useRef(0);
  const options = variantOptions ?? [];

  const setGalleryIndex = useCallback((index: number) => {
    setGalleryIndexState(index);
  }, []);

  const browseGallery = useCallback((index: number, force = false) => {
    // Gallery drag → STYLE click: residual scroll can still look like a
    // "user gesture" and wipe the pin on the first click only. Thumb/arrow
    // passes force=true and always clears.
    if (!force && Date.now() - stylePinAtRef.current < 400) {
      setGalleryIndexState(index);
      return;
    }
    setVariantHeroSrc(null);
    setGalleryIndexState(index);
  }, []);

  const syncGalleryToVariant = useCallback(
    (variantIndex: number) => {
      const option = options[variantIndex];
      const img = option?.image?.trim();
      if (!img) return;

      // Pin hero to the selected style. Residual gallery scroll must not clear this
      // (see browseGallery vs setGalleryIndex) or the first STYLE click after a
      // gallery drag looks like it "didn't take."
      stylePinAtRef.current = Date.now();
      setVariantHeroSrc(img);

      const idx = findGalleryIndexForVariant(option, gallerySlides);
      setGalleryIndexState(idx >= 0 ? idx : 0);
    },
    [gallerySlides, options],
  );

  const value = useMemo(
    () => ({
      galleryIndex,
      variantHeroSrc,
      setGalleryIndex,
      browseGallery,
      syncGalleryToVariant,
    }),
    [
      galleryIndex,
      variantHeroSrc,
      setGalleryIndex,
      browseGallery,
      syncGalleryToVariant,
    ],
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
