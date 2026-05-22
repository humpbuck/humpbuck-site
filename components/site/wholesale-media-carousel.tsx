"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StorefrontImage } from "@/components/site/storefront-image";
import { WholesaleVideoPosterThumb } from "@/components/site/wholesale-video-poster-thumb";
import {
  isWholesaleVideoUrl,
  wholesaleListingPosterUrl,
} from "@/lib/wholesale-listing-shared";

function WholesaleMediaSlide({
  url,
  alt,
  priority,
}: {
  url: string;
  alt: string;
  priority?: boolean;
}) {
  if (isWholesaleVideoUrl(url)) {
    return (
      <div className="relative aspect-square w-full min-w-full shrink-0 snap-center bg-paper">
        <video
          className="absolute inset-0 block h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
          aria-label={alt}
        >
          <source src={url} />
        </video>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full min-w-full shrink-0 snap-center">
      <StorefrontImage
        src={url}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-center"
        sizes="(max-width:1024px) 100vw, 560px"
      />
    </div>
  );
}

export function WholesaleMediaCarousel({
  alt,
  mediaUrls,
}: {
  alt: string;
  mediaUrls: string[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const urls = useMemo(
    () => mediaUrls.map((x) => x.trim()).filter(Boolean),
    [mediaUrls],
  );
  const posterUrl = useMemo(() => wholesaleListingPosterUrl(urls), [urls]);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el || urls.length === 0) return;
      const i = ((index % urls.length) + urls.length) % urls.length;
      const w = el.clientWidth;
      el.scrollTo({ left: i * w, behavior: "smooth" });
      setActive(i);
    },
    [urls.length],
  );

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || urls.length === 0) return;
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(i, urls.length - 1));
  }, [urls.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    queueMicrotask(() => setActive(0));
  }, [urls.join("\0")]);

  if (urls.length === 0) return null;

  return (
    <div className="relative min-w-0 max-w-full">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-paper shadow-card">
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {urls.map((src, i) => (
              <WholesaleMediaSlide
                key={`${i}-${src}`}
                url={src}
                alt={`${alt} — ${i + 1}`}
                priority={i === 0}
              />
            ))}
          </div>
          {urls.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => scrollTo(active - 1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(active + 1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Next"
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {urls.length > 1 ? (
        <>
          <div className="mt-4 flex w-full max-w-full justify-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {urls.map((src, i) => (
              <button
                key={`thumb-${i}-${src}`}
                type="button"
                onClick={() => scrollTo(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  active === i
                    ? "border-ink ring-2 ring-ink/10"
                    : "border-line hover:border-ink/25"
                }`}
                aria-label={`View media ${i + 1}`}
              >
                {isWholesaleVideoUrl(src) ? (
                  <WholesaleVideoPosterThumb
                    posterUrl={posterUrl}
                    videoUrl={src}
                    alt={`${alt} video`}
                    sizes="64px"
                  />
                ) : (
                  <StorefrontImage
                    src={src}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="64px"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  active === i ? "w-6 bg-ink" : "w-1.5 bg-ink/20"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
