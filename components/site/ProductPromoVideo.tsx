"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { isDirectVideoUrl, youtubeEmbedUrl } from "@/lib/blog-video";

function showcaseShellClass(isLandscape: boolean): string {
  return isLandscape
    ? "w-full"
    : "w-full max-w-[min(100%,18rem)] sm:max-w-[min(100%,20rem)] lg:max-w-[min(100%,22rem)]";
}

/**
 * Product showcase on the PDP left column.
 * Supports R2/direct MP4 (aspect from file metadata) and YouTube watch/embed URLs.
 */
export function ProductPromoVideo({
  productName,
  src,
  poster,
  embedded = false,
}: {
  productName: string;
  src: string;
  poster?: string;
  embedded?: boolean;
}) {
  const t = useTranslations("Product");
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const ytEmbed = useMemo(() => youtubeEmbedUrl(src), [src]);
  const isDirect = useMemo(() => isDirectVideoUrl(src), [src]);
  const isLandscape = ytEmbed
    ? true
    : aspectRatio != null && aspectRatio >= 1;
  const showcaseLabel = t("productShowcase");
  const aria = t("productShowcaseVideoAria", { product: productName });

  const onLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  }, []);

  const videoBox = ytEmbed ? (
    <div
      className="relative isolate w-full overflow-hidden rounded-2xl border border-line bg-[#0a0a0a] shadow-sm"
      style={{ aspectRatio: 16 / 9 }}
    >
      <iframe
        title={aria}
        src={ytEmbed}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="absolute inset-0 z-0 h-full w-full border-0"
      />
    </div>
  ) : (
    <div
      className="relative isolate w-full overflow-hidden rounded-2xl border border-line bg-[#0a0a0a] shadow-sm"
      style={{ aspectRatio: aspectRatio ?? 9 / 16 }}
    >
      <video
        className="absolute inset-0 z-0 block h-full w-full object-contain"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={aria}
        onLoadedMetadata={onLoadedMetadata}
      >
        <source src={src} type={isDirect && /\.webm(\?|$)/i.test(src) ? "video/webm" : "video/mp4"} />
      </video>
    </div>
  );

  const shellClass = showcaseShellClass(isLandscape);

  if (embedded) {
    return (
      <section className="flex w-full shrink-0 flex-col gap-3 pt-0">
        <h2 className="shrink-0 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
          {showcaseLabel}
        </h2>
        <div className={`flex w-full flex-col ${isLandscape ? "" : "items-center"}`}>
          <div className={shellClass}>{videoBox}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 border-t border-line pt-14">
      <h2 className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
        {showcaseLabel}
      </h2>
      <div className={`mx-auto mt-8 sm:mt-10 ${shellClass}`}>{videoBox}</div>
    </section>
  );
}
