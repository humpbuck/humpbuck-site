import { cache } from "react";
import { R2_GALLERY_SPECS_BY_SLUG } from "@/lib/r2";
import { getPdpR2Media } from "@/lib/r2-pdp-media";

/**
 * Shop / series card image: admin `image` or first gallery URL, else R2 discovery fallback.
 */
export const getShopCardR2GalleryImage = cache(
  async (
    productSlug: string,
    catalogImage?: string,
    catalogGallery?: string[],
  ): Promise<string | null> => {
    const fromGallery = catalogGallery
      ?.map((u) => u.trim())
      .find(Boolean);
    const fromAdmin = fromGallery ?? catalogImage?.trim();
    if (fromAdmin) return fromAdmin;

    const spec = R2_GALLERY_SPECS_BY_SLUG[productSlug];
    if (!spec) return null;
    const pdp = await getPdpR2Media(spec);
    const g = pdp.gallery;
    if (g && g.length > 0) return g[0];
    return null;
  },
);
