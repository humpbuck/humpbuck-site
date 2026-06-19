"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { StorefrontImage } from "@/components/site/storefront-image";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const LIGHTBOX_HISTORY_KEY = "humpbuckLightbox";
const SCROLL_NAV_THRESHOLD_PX = 4;
const NAV_STRIP_MIN_PX = 56;
const NAV_STRIP_WIDTH_RATIO = 0.15;

function clampPan(x: number, y: number, scale: number, width: number, height: number) {
  if (scale <= 1) return { x: 0, y: 0 };
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;
  return {
    x: Math.min(Math.max(x, -maxX), maxX),
    y: Math.min(Math.max(y, -maxY), maxY),
  };
}

function computeContainedRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
) {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, w: containerWidth, h: containerHeight };
  }
  const fit = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const w = imageWidth * fit;
  const h = imageHeight * fit;
  return { x: (containerWidth - w) / 2, y: (containerHeight - h) / 2, w, h };
}

function isPointOnLetterbox(
  localX: number,
  localY: number,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
  transform: { scale: number; x: number; y: number },
) {
  const base = computeContainedRect(containerWidth, containerHeight, imageWidth, imageHeight);
  const cx = containerWidth / 2;
  const cy = containerHeight / 2;
  const ux = (localX - cx - transform.x) / transform.scale + cx;
  const uy = (localY - cy - transform.y) / transform.scale + cy;
  return ux < base.x || ux > base.x + base.w || uy < base.y || uy > base.y + base.h;
}

function LightboxZoomSlide({
  src,
  alt,
  isActive,
  suppressGhostClickRef,
  onSlideTouchMoved,
  onTapLetterboxClose,
  onZoomChange,
}: {
  src: string;
  alt: string;
  isActive: boolean;
  suppressGhostClickRef: RefObject<boolean>;
  onSlideTouchMoved: () => void;
  onTapLetterboxClose: () => void;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const naturalSizeRef = useRef({ w: 0, h: 0 });
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const touchRef = useRef<{
    x: number;
    y: number;
    moved: boolean;
    panning: boolean;
    tx: number;
    ty: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
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

      if (e.touches.length === 1 && touchRef.current && scaleRef.current > 1) {
        const t = e.touches[0];
        const touch = touchRef.current;
        if (Math.hypot(t.clientX - touch.x, t.clientY - touch.y) > 8) {
          touch.moved = true;
          touch.panning = true;
        }
        if (touch.panning) {
          e.preventDefault();
          applyTransform(
            scaleRef.current,
            touch.tx + (t.clientX - touch.x),
            touch.ty + (t.clientY - touch.y),
          );
        }
        return;
      }

      if (e.touches.length === 1 && touchRef.current && scaleRef.current <= 1) {
        const t = e.touches[0];
        if (Math.hypot(t.clientX - touchRef.current.x, t.clientY - touchRef.current.y) > 8) {
          touchRef.current.moved = true;
          onSlideTouchMoved();
        }
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [applyTransform, isActive]);

  const handleTap = useCallback(
    (clientX: number, clientY: number) => {
      if (suppressGhostClickRef.current) return;

      const el = rootRef.current;
      const width = el?.clientWidth ?? 0;
      const height = el?.clientHeight ?? 0;
      const { w: imageWidth, h: imageHeight } = naturalSizeRef.current;
      const rect = el?.getBoundingClientRect();
      const localX = rect ? clientX - rect.left : 0;
      const localY = rect ? clientY - rect.top : 0;
      const onLetterbox =
        width > 0 &&
        height > 0 &&
        imageWidth > 0 &&
        imageHeight > 0 &&
        isPointOnLetterbox(localX, localY, width, height, imageWidth, imageHeight, {
          scale: scaleRef.current,
          x: translateRef.current.x,
          y: translateRef.current.y,
        });

      if (onLetterbox) {
        onTapLetterboxClose();
      }
    },
    [suppressGhostClickRef, onTapLetterboxClose],
  );

  useEffect(() => {
    naturalSizeRef.current = { w: 0, h: 0 };
  }, [src]);

  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      pinchRef.current = { dist, scale: scaleRef.current };
      touchRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const target = document.elementFromPoint(t.clientX, t.clientY);
      if (target?.closest("[data-lightbox-nav]")) {
        touchRef.current = null;
        return;
      }
      touchRef.current = {
        x: t.clientX,
        y: t.clientY,
        moved: false,
        panning: false,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
      };
    }
  };

  const onTouchEnd = (e: ReactTouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) {
      const touch = touchRef.current;
      if (touch?.moved) {
        onSlideTouchMoved();
        suppressClickRef.current = true;
      } else if (touch) {
        suppressClickRef.current = true;
        const t = e.changedTouches[0];
        if (t) handleTap(t.clientX, t.clientY);
      }
      touchRef.current = null;
      if (scaleRef.current < 1.05) resetZoom();
    }
  };

  const onClick = (e: ReactMouseEvent) => {
    if (suppressClickRef.current || suppressGhostClickRef.current) return;
    handleTap(e.clientX, e.clientY);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full min-w-full shrink-0 snap-center overflow-hidden"
      style={{ touchAction: isZoomed ? "none" : "pan-x" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onClick={onClick}
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
          onLoadingComplete={(img) => {
            naturalSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };
          }}
        />
      </div>
    </div>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressGhostClickRef = useRef(false);
  const touchSessionRef = useRef<{
    startScrollLeft: number;
    startX: number;
    startY: number;
    navigated: boolean;
  } | null>(null);
  const corridorTapRef = useRef<"left" | "right" | null>(null);
  const suppressScrollRef = useRef(false);
  const prevOpenRef = useRef(false);
  const closedByPopRef = useRef(false);
  const backdropTouchRef = useRef<{ x: number; y: number } | null>(null);
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

  const navStripWidth = useCallback(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    return Math.max(NAV_STRIP_MIN_PX, width * NAV_STRIP_WIDTH_RATIO);
  }, []);

  const navSideAt = useCallback(
    (clientX: number) => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return null;
      const edge = navStripWidth();
      const x = clientX - box.left;
      if (x < edge) return "left";
      if (x > box.width - edge) return "right";
      return null;
    },
    [navStripWidth],
  );

  const beginTouchSession = useCallback(
    (startScrollLeft: number, startX: number, startY: number) => {
      touchSessionRef.current = { startScrollLeft, startX, startY, navigated: false };
      suppressGhostClickRef.current = false;
    },
    [],
  );

  const endTouchSession = useCallback(() => {
    const session = touchSessionRef.current;
    if (session?.navigated) {
      suppressGhostClickRef.current = true;
    }
    touchSessionRef.current = null;
  }, []);

  const markNavigated = useCallback(() => {
    const el = scrollerRef.current;
    if (touchSessionRef.current) {
      touchSessionRef.current.navigated = true;
    } else {
      touchSessionRef.current = {
        startScrollLeft: el?.scrollLeft ?? 0,
        startX: 0,
        startY: 0,
        navigated: true,
      };
    }
    suppressGhostClickRef.current = true;
  }, []);

  const requestLetterboxClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const isOutsideImageContainer = useCallback((clientX: number, clientY: number) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return true;
    return (
      clientX < box.left ||
      clientX > box.right ||
      clientY < box.top ||
      clientY > box.bottom
    );
  }, []);

  const handleBackdropTap = useCallback(
    (clientX: number, clientY: number) => {
      if (suppressGhostClickRef.current) return;
      if (isOutsideImageContainer(clientX, clientY)) {
        onClose();
      }
    },
    [isOutsideImageContainer, onClose],
  );

  const navigateTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (slideZoomed) return;
      markNavigated();
      const el = scrollerRef.current;
      const n = images.length;
      if (!el || n === 0) return;
      const i = ((index % n) + n) % n;
      requestAnimationFrame(() => {
        const w = el.clientWidth;
        el.scrollTo({ left: i * w, behavior });
        setActive(i);
        onIndexChange?.(i);
        bumpControls();
      });
    },
    [images.length, onIndexChange, bumpControls, markNavigated, slideZoomed],
  );

  const onScroll = useCallback(() => {
    if (suppressScrollRef.current || slideZoomed) return;
    const el = scrollerRef.current;
    if (!el || images.length === 0) return;
    const session = touchSessionRef.current;
    if (session && Math.abs(el.scrollLeft - session.startScrollLeft) > SCROLL_NAV_THRESHOLD_PX) {
      markNavigated();
    }
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    const next = Math.min(i, images.length - 1);
    setActive(next);
    onIndexChange?.(next);
    bumpControls();
  }, [images.length, onIndexChange, bumpControls, slideZoomed, markNavigated]);

  useLayoutEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }
    if (!prevOpenRef.current) {
      setActive(initialIndex);
      setControlsVisible(false);
      setSlideZoomed(false);
      suppressGhostClickRef.current = false;
      touchSessionRef.current = null;
      corridorTapRef.current = null;
      clearHideControlsTimer();
      const el = scrollerRef.current;
      if (el) {
        suppressScrollRef.current = true;
        const w = Math.max(el.clientWidth, 1);
        el.scrollLeft = initialIndex * w;
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
    suppressGhostClickRef.current = false;
    touchSessionRef.current = null;
    corridorTapRef.current = null;
    clearHideControlsTimer();
  }, [open, clearHideControlsTimer]);

  useEffect(
    () => () => {
      clearHideControlsTimer();
    },
    [clearHideControlsTimer],
  );

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

    const onGestureStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || slideZoomed) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-lightbox-nav]")) return;
      const t = e.touches[0];
      beginTouchSession(el.scrollLeft, t.clientX, t.clientY);
      const side = navSideAt(t.clientX);
      if (side) {
        corridorTapRef.current = side;
        markNavigated();
      } else {
        corridorTapRef.current = null;
      }
    };

    const onGestureMove = (e: TouchEvent) => {
      const session = touchSessionRef.current;
      if (!session || e.touches.length !== 1 || slideZoomed) return;
      const t = e.touches[0];
      if (Math.abs(el.scrollLeft - session.startScrollLeft) > SCROLL_NAV_THRESHOLD_PX) {
        corridorTapRef.current = null;
        markNavigated();
        return;
      }
      if (Math.hypot(t.clientX - session.startX, t.clientY - session.startY) > 10) {
        corridorTapRef.current = null;
        markNavigated();
      }
    };

    const onGestureEnd = () => {
      const side = corridorTapRef.current;
      corridorTapRef.current = null;
      const session = touchSessionRef.current;
      const scrolled =
        !!session &&
        Math.abs(el.scrollLeft - session.startScrollLeft) > SCROLL_NAV_THRESHOLD_PX;
      if (side && !slideZoomed && !scrolled) {
        navigateTo(active + (side === "right" ? 1 : -1));
      }
      endTouchSession();
    };

    const onScrollEnd = () => {
      scheduleHideControls();
    };

    el.addEventListener("touchstart", onGestureStart, { capture: true, passive: true });
    el.addEventListener("touchmove", onGestureMove, { capture: true, passive: true });
    el.addEventListener("touchend", onGestureEnd, { capture: true, passive: true });
    el.addEventListener("touchcancel", onGestureEnd, { capture: true, passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    return () => {
      el.removeEventListener("touchstart", onGestureStart, true);
      el.removeEventListener("touchmove", onGestureMove, true);
      el.removeEventListener("touchend", onGestureEnd, true);
      el.removeEventListener("touchcancel", onGestureEnd, true);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
    };
  }, [
    open,
    onScroll,
    scheduleHideControls,
    slideZoomed,
    active,
    beginTouchSession,
    markNavigated,
    endTouchSession,
    navSideAt,
    navigateTo,
  ]);

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
        navigateTo(active - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateTo(active + 1);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose, active, images.length, navigateTo, slideZoomed]);

  const onNavPointerDown = useCallback(
    (e: ReactTouchEvent | ReactPointerEvent | ReactMouseEvent) => {
      e.stopPropagation();
      markNavigated();
    },
    [markNavigated],
  );

  const onArrowActivate = useCallback(
    (e: ReactTouchEvent | ReactPointerEvent | ReactMouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      corridorTapRef.current = null;
      navigateTo(index);
    },
    [navigateTo],
  );

  const navStripWidthPx = navStripWidth();

  const arrowClass = (side: "left" | "right") =>
    `absolute ${side === "left" ? "left-0" : "right-0"} top-0 z-30 flex h-full items-center justify-center text-paper transition-opacity duration-300 ${
      controlsVisible ? "opacity-100" : "opacity-0 [@media(hover:hover)]:group-hover/lightbox:opacity-100"
    }`;

  if (!open || typeof document === "undefined" || images.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overscroll-none bg-ink/92 p-4 md:bg-ink/85 md:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onTouchStart={(e) => {
        if (e.touches.length !== 1) {
          backdropTouchRef.current = null;
          return;
        }
        const t = e.touches[0];
        backdropTouchRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = backdropTouchRef.current;
        backdropTouchRef.current = null;
        if (!start || e.changedTouches.length === 0) return;
        const t = e.changedTouches[0];
        if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > 10) return;
        handleBackdropTap(t.clientX, t.clientY);
      }}
      onTouchCancel={() => {
        backdropTouchRef.current = null;
      }}
      onClick={(e) => {
        handleBackdropTap(e.clientX, e.clientY);
      }}
    >
      <div
        ref={containerRef}
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
              suppressGhostClickRef={suppressGhostClickRef}
              onSlideTouchMoved={markNavigated}
              onTapLetterboxClose={requestLetterboxClose}
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
              data-lightbox-nav=""
              style={{ width: navStripWidthPx }}
              onTouchStart={onNavPointerDown}
              onTouchEnd={(e) => onArrowActivate(e, active - 1)}
              onPointerDown={onNavPointerDown}
              onPointerUp={(e) => {
                if (e.pointerType === "touch") return;
                onArrowActivate(e, active - 1);
              }}
              onClick={(e) => onArrowActivate(e, active - 1)}
              className={arrowClass("left")}
              aria-label="Previous image"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink/50 shadow-sm backdrop-blur-sm">
                <ChevronLeft size={24} strokeWidth={2} />
              </span>
            </button>
            <button
              type="button"
              data-lightbox-nav=""
              style={{ width: navStripWidthPx }}
              onTouchStart={onNavPointerDown}
              onTouchEnd={(e) => onArrowActivate(e, active + 1)}
              onPointerDown={onNavPointerDown}
              onPointerUp={(e) => {
                if (e.pointerType === "touch") return;
                onArrowActivate(e, active + 1);
              }}
              onClick={(e) => onArrowActivate(e, active + 1)}
              className={arrowClass("right")}
              aria-label="Next image"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink/50 shadow-sm backdrop-blur-sm">
                <ChevronRight size={24} strokeWidth={2} />
              </span>
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
