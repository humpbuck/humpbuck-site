"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { youtubeEmbedUrl } from "@/lib/blog-video";

function showcaseShellClass(isLandscape: boolean): string {
  return isLandscape
    ? "w-full"
    : "w-full max-w-[min(100%,18rem)] sm:max-w-[min(100%,20rem)] lg:max-w-[min(100%,22rem)]";
}

/**
 * Product showcase on the PDP left column.
 * R2/direct video uses the same pattern as watchsourcego: `<video src=…>` (not nested
 * `<source type>`), so browsers can load Range/metadata reliably.
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
  const [loadFailed, setLoadFailed] = useState(false);
  const ytEmbed = useMemo(() => youtubeEmbedUrl(src), [src]);
  const isLandscape = ytEmbed
    ? true
    : aspectRatio != null && aspectRatio >= 1;
  const showcaseLabel = t("productShowcase");
  const aria = t("productShowcaseVideoAria", { product: productName });

  const onLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setLoadFailed(false);
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  }, []);

  const onError = useCallback(() => {
    setLoadFailed(true);
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
    <div className="w-full">
      <div
        className="w-full overflow-hidden rounded-2xl border border-line bg-[#0a0a0a] shadow-sm"
        style={{ aspectRatio: aspectRatio ?? 9 / 16 }}
      >
        {src.trim() ? (
          <video
            key={src}
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
            aria-label={aria}
            onLoadedMetadata={onLoadedMetadata}
            onError={onError}
          />
        ) : null}
      </div>
      {loadFailed ? (
        <p className="mt-2 text-center text-[11px] text-muted">
          Video failed to load. Try opening the R2 URL in a new tab, or clear cache for
          assets.humpbuck.com.
        </p>
      ) : null}
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
