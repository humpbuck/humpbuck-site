import { cache } from "react";
import { R2_GALLERY_SPECS_BY_SLUG } from "@/lib/r2";
import { getPdpR2Media } from "@/lib/r2-pdp-media";

/**
 * First resolved gallery URL for shop/series cards (R2 truth when spec + media exist).
 * Deduplicated per request via React `cache()`.
 */
export const getShopCardR2GalleryImage = cache(
  async (productSlug: string): Promise<string | null> => {
    const spec = R2_GALLERY_SPECS_BY_SLUG[productSlug];
    if (!spec) return null;
    const pdp = await getPdpR2Media(spec);
    const g = pdp.gallery;
    if (g && g.length > 0) return g[0];
    return null;
  },
);
