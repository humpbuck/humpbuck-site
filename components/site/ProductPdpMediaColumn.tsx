import { ProductPdpSyncedCarousel } from "@/components/site/product-pdp-synced-carousel";
import { ProductPromoVideo } from "@/components/site/ProductPromoVideo";

/**
 * Product detail page — left column media stack.
 *
 * **Canonical layout (reference: DIGI-TEMP 2301):** full-width carousel on top;
 * when `promoVideo` is set, the “Product showcase” MP4 block sits directly
 * beneath it in the same column (`embedded` promo video; aspect ratio follows the file).
 * On the PDP, set each video `poster` to the first resolved gallery URL so the cover matches the main slide (RM-M01-style).
 * Multiple R2 `video/*.mp4` files render as a stacked “Product showcase” section.
 */
export function ProductPdpMediaColumn({
  productName,
  gallerySlides,
  themeGlowClass,
  promoVideo,
  promoVideos,
}: {
  productName: string;
  gallerySlides: string[];
  themeGlowClass: string;
  /** @deprecated Use `promoVideos` (supports multiple R2 videos). */
  promoVideo?: { src: string; poster?: string } | null;
  promoVideos?: { src: string; poster?: string }[] | null;
}) {
  const videos =
    promoVideos != null && promoVideos.length > 0
      ? promoVideos
      : promoVideo != null
        ? [promoVideo]
        : [];

  if (videos.length > 0) {
    return (
      <div className="flex min-h-0 min-w-0 flex-col justify-between gap-10 lg:h-full lg:min-h-0">
        <div className="min-w-0 shrink-0">
          <ProductPdpSyncedCarousel
            alt={productName}
            images={gallerySlides}
            themeGlowClass={themeGlowClass}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-h-0 flex-col justify-end gap-10 lg:min-h-0">
            {videos.map((v) => (
              <ProductPromoVideo
                key={v.src}
                embedded
                productName={productName}
                src={v.src}
                poster={v.poster}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <ProductPdpSyncedCarousel
        alt={productName}
        images={gallerySlides}
        themeGlowClass={themeGlowClass}
      />
    </div>
  );
}
