"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const options = variantOptions ?? [];
  /** While STYLE sync settles, ignore gallery scroll/thumb updates that clear the hero. */
  const styleSyncLockRef = useRef(false);
  const styleSyncUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginStyleSyncLock = useCallback(() => {
    styleSyncLockRef.current = true;
    if (styleSyncUnlockTimerRef.current) {
      clearTimeout(styleSyncUnlockTimerRef.current);
    }
    styleSyncUnlockTimerRef.current = setTimeout(() => {
      styleSyncLockRef.current = false;
      styleSyncUnlockTimerRef.current = null;
    }, 280);
  }, []);

  useEffect(
    () => () => {
      if (styleSyncUnlockTimerRef.current) {
        clearTimeout(styleSyncUnlockTimerRef.current);
      }
    },
    [],
  );

  const setGalleryIndex = useCallback((index: number) => {
    // STYLE→gallery sync scrolls the carousel; those scroll events must not wipe
    // the selected variant hero, or the big image snaps back to the wrong still.
    if (styleSyncLockRef.current) {
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

      beginStyleSyncLock();
      // Always pin the hero to the selected style image. Gallery index is only a
      // hint for which thumb to highlight; scroll races must not hide this.
      setVariantHeroSrc(img);

      const idx = findGalleryIndexForVariant(option, gallerySlides);
      setGalleryIndexState(idx >= 0 ? idx : 0);
    },
    [beginStyleSyncLock, gallerySlides, options],
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
