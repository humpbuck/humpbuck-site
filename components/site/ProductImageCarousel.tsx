"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageLightbox } from "@/components/site/image-lightbox";
import { StorefrontImage } from "@/components/site/storefront-image";
import { useTapWithoutDrag } from "@/components/site/use-tap-without-drag";
import { preloadImageUrls } from "@/lib/preload-images-client";

function ProductImageZoomSlide({
  src,
  alt,
  label,
  priority,
  eager,
  onOpen,
}: {
  src: string;
  alt: string;
  label: string;
  priority?: boolean;
  eager?: boolean;
  onOpen: () => void;
}) {
  const tap = useTapWithoutDrag(onOpen);

  return (
    <button
      type="button"
      {...tap}
      className="relative aspect-square w-full min-w-full shrink-0 cursor-zoom-in snap-center touch-pan-x"
      aria-label={label}
    >
      <StorefrontImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority || eager ? "eager" : undefined}
        fetchPriority={priority ? "high" : eager ? "low" : undefined}
        className="pointer-events-none object-cover object-center"
        sizes="(max-width:1024px) 100vw, 50vw"
      />
    </button>
  );
}

export function ProductImageCarousel({
  alt,
  images,
  themeGlowClass,
}: {
  alt: string;
  images: string[];
  themeGlowClass: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const n = images.length;
      if (n === 0) return;
      const i = ((index % n) + n) % n;
      const w = el.clientWidth;
      el.scrollTo({ left: i * w, behavior: "smooth" });
      setActive(i);
    },
    [images.length],
  );

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !images.length) return;
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(i, images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const imagesKey = useMemo(() => images.join("\0"), [images]);

  useEffect(() => {
    queueMicrotask(() => setActive(0));
  }, [imagesKey]);

  useEffect(() => {
    preloadImageUrls(images);
  }, [imagesKey]);

  if (images.length === 0) return null;

  return (
    <div className="relative min-w-0 max-w-full">
      <div
        className={`pointer-events-none absolute -inset-3 rounded-[32px] bg-linear-to-br sm:-inset-6 ${themeGlowClass} blur-2xl opacity-70`}
      />
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-paper shadow-card">
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => (
              <ProductImageZoomSlide
                key={`${i}-${src}`}
                src={src}
                alt={`${alt} — ${i + 1}`}
                label={`${alt} — view full size`}
                priority={i === 0}
                eager={i > 0 && i < 4}
                onOpen={() => {
                  setActive(i);
                  setLightboxStartIndex(i);
                  setLightboxOpen(true);
                }}
              />
            ))}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollTo(active - 1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(active + 1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <div className="mt-4 flex w-full max-w-full justify-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((src, i) => (
              <button
                key={`thumb-${i}-${src}`}
                type="button"
                onClick={() => scrollTo(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-paper transition ${
                  active === i
                    ? "border-ink ring-2 ring-ink/10"
                    : "border-line hover:border-ink/25"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <StorefrontImage
                  src={src}
                  alt=""
                  fill
                  loading="eager"
                  fetchPriority="low"
                  className="object-cover object-center"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
          <div
            className="mt-3 flex justify-center gap-1.5"
            aria-hidden
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  active === i ? "w-6 bg-ink" : "w-1.5 bg-ink/20"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <ImageLightbox
        images={images}
        alt={alt}
        initialIndex={lightboxStartIndex}
        open={lightboxOpen}
        onIndexChange={(i) => {
          setActive(i);
          const el = scrollerRef.current;
          if (!el) return;
          const w = el.clientWidth;
          el.scrollTo({ left: i * w, behavior: "auto" });
        }}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
