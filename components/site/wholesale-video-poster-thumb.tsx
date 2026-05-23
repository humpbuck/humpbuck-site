"use client";

import { Play } from "lucide-react";
import { StorefrontImage } from "@/components/site/storefront-image";
import { isWholesaleVideoUrl } from "@/lib/wholesale-listing-shared";

export function WholesaleVideoPosterThumb({
  posterUrl,
  videoUrl,
  alt,
  sizes = "64px",
  className = "",
  imageEager = false,
}: {
  posterUrl: string | null;
  videoUrl?: string;
  alt: string;
  sizes?: string;
  className?: string;
  imageEager?: boolean;
}) {
  const showVideoFrame = !posterUrl && videoUrl && isWholesaleVideoUrl(videoUrl);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-paper ${className}`.trim()}>
      {posterUrl ? (
        <StorefrontImage
          src={posterUrl}
          alt={alt}
          fill
          loading={imageEager ? "eager" : undefined}
          fetchPriority={imageEager ? "low" : undefined}
          className="object-cover object-center"
          sizes={sizes}
        />
      ) : showVideoFrame ? (
        <video
          className="absolute inset-0 block h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          aria-hidden
        >
          <source src={videoUrl} />
        </video>
      ) : (
        <div className="absolute inset-0 bg-ink/5" aria-hidden />
      )}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/15"
        aria-hidden
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-ink/55 text-paper shadow-md sm:h-10 sm:w-10">
          <Play className="ml-0.5 h-4 w-4 fill-current sm:h-[18px] sm:w-[18px]" strokeWidth={0} />
        </span>
      </span>
    </div>
  );
}
