import { cache } from "react";
import { R2_GALLERY_SPECS_BY_SLUG } from "@/lib/r2";
import { getPdpR2Media } from "@/lib/r2-pdp-media";

function normalizeShopImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, "https://placeholder.local");
    return parsed.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

/** First gallery URL that differs from the cover (shop card hover image). */
export function resolveShopCardHoverImage(
  coverUrl: string | null | undefined,
  catalogGallery?: string[],
): string | null {
  const gallery = (catalogGallery ?? []).map((u) => u.trim()).filter(Boolean);
  if (gallery.length === 0) return null;

  const coverNorm = normalizeShopImageUrl(coverUrl ?? "");
  for (const url of gallery) {
    if (normalizeShopImageUrl(url) !== coverNorm) return url;
  }
  return null;
}

export type ShopCardImagePair = {
  cover: string | null;
  hover: string | null;
};

/**
 * Shop card images: cover = admin `image` (首图), else first gallery; hover = next distinct gallery URL.
 */
export const getShopCardImages = cache(
  async (
    productSlug: string,
    catalogImage?: string,
    catalogGallery?: string[],
  ): Promise<ShopCardImagePair> => {
    const galleryAdmin = (catalogGallery ?? []).map((u) => u.trim()).filter(Boolean);
    const coverFromAdmin = catalogImage?.trim();

    let cover = coverFromAdmin || galleryAdmin[0] || null;
    let hover = resolveShopCardHoverImage(cover, galleryAdmin);

    const spec = R2_GALLERY_SPECS_BY_SLUG[productSlug];
    if ((!cover || !hover) && spec) {
      const pdp = await getPdpR2Media(spec);
      const r2Gallery = (pdp.gallery ?? []).map((u) => u.trim()).filter(Boolean);
      const mergedGallery = galleryAdmin.length > 0 ? galleryAdmin : r2Gallery;
      if (!cover) cover = mergedGallery[0] ?? null;
      if (!hover) hover = resolveShopCardHoverImage(cover, mergedGallery);
    }

    return { cover, hover };
  },
);

/** @deprecated Prefer `getShopCardImages` when hover image is needed. */
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
