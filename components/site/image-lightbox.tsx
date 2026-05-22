"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { StorefrontImage } from "@/components/site/storefront-image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const LIGHTBOX_HISTORY_KEY = "humpbuckLightbox";

function clampPan(x: number, y: number, scale: number, width: number, height: number) {
  if (scale <= 1) return { x: 0, y: 0 };
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;
  return {
    x: Math.min(Math.max(x, -maxX), maxX),
    y: Math.min(Math.max(y, -maxY), maxY),
  };
}

function LightboxZoomSlide({
  src,
  alt,
  isActive,
  onTapClose,
  onZoomChange,
}: {
  src: string;
  alt: string;
  isActive: boolean;
  onTapClose: () => void;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const tapRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const applyTransform = useCallback(
    (scale: number, x: number, y: number) => {
      const el = rootRef.current;
      const width = el?.clientWidth ?? 0;
      const height = el?.clientHeight ?? 0;
      const nextScale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
      const pan = clampPan(x, y, nextScale, width, height);
      scaleRef.current = nextScale;
      translateRef.current = pan;
      setTransform({ scale: nextScale, x: pan.x, y: pan.y });
      const zoomed = nextScale > 1.02;
      setIsZoomed(zoomed);
      onZoomChange(zoomed);
    },
    [onZoomChange],
  );

  const resetZoom = useCallback(() => {
    applyTransform(1, 0, 0);
  }, [applyTransform]);

  useEffect(() => {
    if (!isActive) resetZoom();
  }, [isActive, resetZoom]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !isActive) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        applyTransform(
          pinchRef.current.scale * (dist / pinchRef.current.dist),
          translateRef.current.x,
          translateRef.current.y,
        );
        return;
      }

      if (e.touches.length === 1 && panRef.current && scaleRef.current > 1) {
        e.preventDefault();
        const t = e.touches[0];
        applyTransform(
          scaleRef.current,
          panRef.current.tx + (t.clientX - panRef.current.x),
          panRef.current.ty + (t.clientY - panRef.current.y),
        );
        return;
      }

      if (e.touches.length === 1 && tapRef.current) {
        const t = e.touches[0];
        if (Math.hypot(t.clientX - tapRef.current.x, t.clientY - tapRef.current.y) > 8) {
          tapRef.current.moved = true;
        }
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [applyTransform, isActive]);

  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      pinchRef.current = { dist, scale: scaleRef.current };
      panRef.current = null;
      tapRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (scaleRef.current > 1) {
        panRef.current = {
          x: t.clientX,
          y: t.clientY,
          tx: translateRef.current.x,
          ty: translateRef.current.y,
        };
      } else {
        tapRef.current = { x: t.clientX, y: t.clientY, moved: false };
      }
    }
  };

  const onTouchEnd = (e: ReactTouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) {
      panRef.current = null;
      if (tapRef.current && !tapRef.current.moved && scaleRef.current <= 1.02) {
        onTapClose();
      }
      tapRef.current = null;
      if (scaleRef.current < 1.05) resetZoom();
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full min-w-full shrink-0 snap-center overflow-hidden"
      style={{ touchAction: isZoomed ? "none" : "pan-x" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onClick={() => {
        if (scaleRef.current <= 1.02) onTapClose();
      }}
    >
      <div
        className="relative h-full w-full will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: "center center",
        }}
      >
        <StorefrontImage
          src={src}
          alt={alt}
          fill
          draggable={false}
          className="pointer-events-none object-contain select-none"
          sizes="96vw"
          priority={isActive}
        />
      </div>
    </div>
  );
}

/**
 * Full-viewport image overlay with horizontal swipe between slides.
 * Pinch-to-zoom is handled in-overlay (not browser zoom) to avoid mobile crashes.
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
  const suppressScrollRef = useRef(false);
  const prevOpenRef = useRef(false);
  const closedByPopRef = useRef(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(initialIndex);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [slideZoomed, setSlideZoomed] = useState(false);

  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideControlsTimer();
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      hideControlsTimerRef.current = null;
    }, 850);
  }, [clearHideControlsTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const bumpControls = useCallback(() => {
    revealControls();
    scheduleHideControls();
  }, [revealControls, scheduleHideControls]);

  const scrollTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (slideZoomed) return;
      const el = scrollerRef.current;
      const n = images.length;
      if (!el || n === 0) return;
      const i = ((index % n) + n) % n;
      const w = el.clientWidth;
      el.scrollTo({ left: i * w, behavior });
      setActive(i);
      onIndexChange?.(i);
      bumpControls();
    },
    [images.length, onIndexChange, bumpControls, slideZoomed],
  );

  const onScroll = useCallback(() => {
    if (suppressScrollRef.current || slideZoomed) return;
    const el = scrollerRef.current;
    if (!el || images.length === 0) return;
    draggingRef.current = true;
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    const next = Math.min(i, images.length - 1);
    setActive(next);
    onIndexChange?.(next);
    bumpControls();
  }, [images.length, onIndexChange, bumpControls, slideZoomed]);

  useLayoutEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }
    if (!prevOpenRef.current) {
      setActive(initialIndex);
      setControlsVisible(false);
      setSlideZoomed(false);
      clearHideControlsTimer();
      const el = scrollerRef.current;
      if (el) {
        suppressScrollRef.current = true;
        const w = Math.max(el.clientWidth, 1);
        el.scrollLeft = initialIndex * w;
        draggingRef.current = false;
        requestAnimationFrame(() => {
          suppressScrollRef.current = false;
        });
      }
    }
    prevOpenRef.current = open;
  }, [open, initialIndex, clearHideControlsTimer]);

  useEffect(() => {
    setSlideZoomed(false);
  }, [active]);

  useEffect(() => {
    if (open) return;
    setControlsVisible(false);
    setSlideZoomed(false);
    clearHideControlsTimer();
  }, [open, clearHideControlsTimer]);

  useEffect(() => () => clearHideControlsTimer(), [clearHideControlsTimer]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closedByPopRef.current = false;
    history.pushState({ [LIGHTBOX_HISTORY_KEY]: true }, "");
    const onPop = () => {
      closedByPopRef.current = true;
      onClose();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      const state = history.state as Record<string, boolean> | null;
      if (!closedByPopRef.current && state?.[LIGHTBOX_HISTORY_KEY]) {
        history.back();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (!el) return;
    const onScrollEnd = () => {
      window.setTimeout(() => {
        draggingRef.current = false;
      }, 80);
      scheduleHideControls();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    el.addEventListener("touchend", onScrollEnd);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      el.removeEventListener("touchend", onScrollEnd);
    };
  }, [open, onScroll, scheduleHideControls]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (images.length <= 1 || slideZoomed) return;
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
  }, [open, onClose, active, images.length, scrollTo, slideZoomed]);

  if (!open || typeof document === "undefined" || images.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex touch-none items-center justify-center overscroll-none bg-ink/92 p-4 md:bg-ink/85 md:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div
        className="group/lightbox relative h-[min(92vh,1200px)] w-[min(96vw,1200px)] max-w-full touch-auto overscroll-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={scrollerRef}
          className={`flex h-full w-full snap-x snap-mandatory overscroll-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            slideZoomed ? "overflow-x-hidden" : "overflow-x-auto"
          }`}
        >
          {images.map((src, i) => (
            <LightboxZoomSlide
              key={`${i}-${src}`}
              src={src}
              alt={`${alt} — ${i + 1}`}
              isActive={active === i}
              onTapClose={() => {
                if (!draggingRef.current && !slideZoomed) onClose();
              }}
              onZoomChange={(zoomed) => {
                if (active === i) setSlideZoomed(zoomed);
              }}
            />
          ))}
        </div>

        {images.length > 1 && !slideZoomed ? (
          <>
            <button
              type="button"
              onClick={() => scrollTo(active - 1)}
              className={`absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/50 text-paper shadow-sm backdrop-blur-sm transition-opacity duration-300 hover:bg-ink/70 ${
                controlsVisible
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0 [@media(hover:hover)]:group-hover/lightbox:pointer-events-auto [@media(hover:hover)]:group-hover/lightbox:opacity-100"
              }`}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(active + 1)}
              className={`absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/50 text-paper shadow-sm backdrop-blur-sm transition-opacity duration-300 hover:bg-ink/70 ${
                controlsVisible
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0 [@media(hover:hover)]:group-hover/lightbox:pointer-events-auto [@media(hover:hover)]:group-hover/lightbox:opacity-100"
              }`}
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
