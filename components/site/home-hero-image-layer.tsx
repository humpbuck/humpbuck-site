import { StorefrontImage } from "@/components/site/storefront-image";
import { homeHeroDesktopWebpUrl, homeHeroMobileWebpUrl } from "@/lib/r2";

export const heroMinH =
  "min-h-[calc((100svh-var(--site-announcement-h,0px)-72px)*0.85)] md:min-h-[calc(100vh-var(--site-announcement-h,0px)-80px)]";

type Props = {
  mobileSrc?: string;
  desktopSrc?: string;
  alt?: string;
};

/** LCP image layer — no DB; defaults stream before CMS copy. */
export function HomeHeroImageLayer({
  mobileSrc = homeHeroMobileWebpUrl(),
  desktopSrc = homeHeroDesktopWebpUrl(),
  alt = "",
}: Props) {
  return (
    <div className={`relative h-full w-full ${heroMinH}`}>
      <StorefrontImage
        src={mobileSrc}
        alt={alt}
        fill
        priority
        fetchPriority="high"
        className="object-cover object-center md:hidden"
        sizes="100vw"
      />
      <StorefrontImage
        src={desktopSrc}
        alt={alt}
        fill
        className="hidden object-cover object-center md:block"
        sizes="100vw"
      />
    </div>
  );
}

export function HomeHeroImageOverlays() {
  return (
    <>
      <div
        className="absolute inset-0 bg-linear-to-r from-[#080808]/92 via-[#080808]/55 to-transparent md:via-[#080808]/35"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-linear-to-t from-[#080808]/75 via-[#080808]/20 to-transparent md:from-[#080808]/40 md:via-transparent md:to-[#080808]/15"
        aria-hidden
      />
    </>
  );
}
