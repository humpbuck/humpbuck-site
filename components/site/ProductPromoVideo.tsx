"use client";

import { useCallback, useState } from "react";

function showcaseShellClass(isLandscape: boolean): string {
  return isLandscape
    ? "w-full"
    : "w-full max-w-[min(100%,18rem)] sm:max-w-[min(100%,20rem)] lg:max-w-[min(100%,22rem)]";
}

/**
 * Product showcase video on the PDP left column (portrait or landscape MP4).
 * Aspect ratio is read from the file after metadata loads; portrait stays width-capped,
 * landscape uses the full column width.
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
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const isLandscape = aspectRatio != null && aspectRatio >= 1;

  const onLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  }, []);

  const videoBox = (
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
        aria-label={`Product showcase video: ${productName}`}
        onLoadedMetadata={onLoadedMetadata}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );

  const shellClass = showcaseShellClass(isLandscape);

  if (embedded) {
    return (
      <section className="flex w-full shrink-0 flex-col gap-3 pt-0">
        <h2 className="shrink-0 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
          Product showcase
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
        Product showcase
      </h2>
      <div className={`mx-auto mt-8 sm:mt-10 ${shellClass}`}>{videoBox}</div>
    </section>
  );
}
