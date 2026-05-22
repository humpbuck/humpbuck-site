"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StorefrontImage } from "@/components/site/storefront-image";

/**
 * Full-viewport image overlay with horizontal swipe between slides.
 * Tap image (without drag) or backdrop to close. Portaled above modals.
 */
export function ImageLightbox({
  images,
  alt,
  initialIndex,
  onIndexChange,
  open,
  onClose,
}: {
  images: string[];
  alt: string;
  initialIndex: number;
  onIndexChange?: (index: number) => void;
  open: boolean;
  onClose: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const prevOpenRef = useRef(false);
  const [active, setActive] = useState(initialIndex);

  const scrollTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      const n = images.length;
      if (!el || n === 0) return;
      const i = ((index % n) + n) % n;
      const w = el.clientWidth;
      el.scrollTo({ left: i * w, behavior });
      setActive(i);
      onIndexChange?.(i);
    },
    [images.length, onIndexChange],
  );

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || images.length === 0) return;
    draggingRef.current = true;
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    const next = Math.min(i, images.length - 1);
    setActive(next);
    onIndexChange?.(next);
  }, [images.length, onIndexChange]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setActive(initialIndex);
      requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const w = Math.max(el.clientWidth, 1);
        el.scrollTo({ left: initialIndex * w, behavior: "auto" });
      });
    }
    prevOpenRef.current = open;
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    const onScrollEnd = () => {
      window.setTimeout(() => {
        draggingRef.current = false;
      }, 80);
    };
    el.addEventListener("scrollend", onScrollEnd);
    el.addEventListener("touchend", onScrollEnd);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      el.removeEventListener("touchend", onScrollEnd);
    };
  }, [open, onScroll]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (images.length <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollTo(active - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollTo(active + 1);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose, active, images.length, scrollTo]);

  if (!open || typeof document === "undefined" || images.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div
        className="relative h-[min(92vh,1200px)] w-[min(96vw,1200px)] max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={scrollerRef}
          className="flex h-full w-full overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div
              key={`${i}-${src}`}
              className="relative h-full w-full min-w-full shrink-0 cursor-zoom-out snap-center"
              onClick={() => {
                if (!draggingRef.current) onClose();
              }}
            >
              <StorefrontImage
                src={src}
                alt={`${alt} — ${i + 1}`}
                fill
                className="object-contain"
                sizes="96vw"
                priority={Math.abs(i - active) <= 1}
              />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollTo(active - 1)}
              className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/50 text-paper shadow-sm backdrop-blur-sm transition hover:bg-ink/70"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(active + 1)}
              className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/50 text-paper shadow-sm backdrop-blur-sm transition hover:bg-ink/70"
              aria-label="Next image"
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center gap-1.5 pb-1"
              aria-hidden
            >
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    active === i ? "w-6 bg-paper" : "w-1.5 bg-paper/35"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
