"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { StorefrontImage } from "@/components/site/storefront-image";
import { useTapWithoutDrag } from "@/components/site/use-tap-without-drag";
import { WholesaleVideoPosterThumb } from "@/components/site/wholesale-video-poster-thumb";
import {
  isWholesaleVideoUrl,
  wholesaleListingPosterUrl,
} from "@/lib/wholesale-listing-shared";

const BASE_SCALE = 1;
const MAGNIFY_SCALE = 2;
const MAX_PINCH_SCALE = 4;
const PINCH_RATIO = 1.02;
const SCROLL_NAV_THRESHOLD_PX = 4;

/** cover = carousel | full = whole image + grey backdrop | magnify = 1x zoom | pinch = pinch beyond 1x */
type ViewMode = "cover" | "full" | "magnify" | "pinch";

function isPinchBeyondMagnify(scale: number) {
  return scale > MAGNIFY_SCALE * PINCH_RATIO;
}

function canSingleFingerPan(scale: number) {
  return scale > BASE_SCALE * PINCH_RATIO;
}

function clampPan(x: number, y: number, scale: number, width: number, height: number) {
  if (scale <= 1) return { x: 0, y: 0 };
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;
  return {
    x: Math.min(Math.max(x, -maxX), maxX),
    y: Math.min(Math.max(y, -maxY), maxY),
  };
}

function WholesaleVideoSlide({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="relative h-full w-full bg-paper">
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

function WholesaleCoverImageSlide({
  url,
  alt,
  priority,
  onOpenFull,
}: {
  url: string;
  alt: string;
  priority?: boolean;
  onOpenFull: () => void;
}) {
  const tap = useTapWithoutDrag(onOpenFull);

  return (
    <button
      type="button"
      {...tap}
      className="relative h-full w-full cursor-zoom-in touch-pan-x"
      aria-label={`${alt} — view full image`}
    >
      <StorefrontImage
        src={url}
        alt={alt}
        fill
        priority={priority}
        className="pointer-events-none object-cover object-center"
        sizes="(max-width:1024px) 100vw, 560px"
      />
    </button>
  );
}

function WholesaleCenterLightbox({
  images,
  alt,
  activeIndex,
  mode,
  onModeChange,
  onIndexChange,
  onClose,
  suppressTapRef,
  onInteraction,
}: {
  images: string[];
  alt: string;
  activeIndex: number;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  suppressTapRef: RefObject<boolean>;
  onInteraction: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(BASE_SCALE);
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
  const steppedBackToFullRef = useRef(false);
  const [transform, setTransform] = useState({ scale: BASE_SCALE, x: 0, y: 0 });

  const url = images[activeIndex] ?? "";

  const applyTransform = useCallback(
    (scale: number, x: number, y: number) => {
      const el = stageRef.current;
      const width = el?.clientWidth ?? 0;
      const height = el?.clientHeight ?? 0;
      const minScale = mode === "full" ? BASE_SCALE : MAGNIFY_SCALE;
      const nextScale = Math.min(Math.max(scale, minScale), MAX_PINCH_SCALE);
      const pan = clampPan(x, y, nextScale, width, height);
      scaleRef.current = nextScale;
      translateRef.current = pan;
      setTransform({ scale: nextScale, x: pan.x, y: pan.y });

      if (isPinchBeyondMagnify(nextScale)) {
        onModeChange("pinch");
      } else if (nextScale >= MAGNIFY_SCALE * 0.98) {
        onModeChange("magnify");
      } else {
        onModeChange("full");
      }
    },
    [mode, onModeChange],
  );

  const resetTransformForMode = useCallback(
    (nextMode: ViewMode) => {
      if (nextMode === "full") {
        scaleRef.current = BASE_SCALE;
        translateRef.current = { x: 0, y: 0 };
        setTransform({ scale: BASE_SCALE, x: 0, y: 0 });
        return;
      }
      scaleRef.current = MAGNIFY_SCALE;
      translateRef.current = { x: 0, y: 0 };
      setTransform({ scale: MAGNIFY_SCALE, x: 0, y: 0 });
    },
    [],
  );

  useEffect(() => {
    steppedBackToFullRef.current = false;
    if (mode === "full") resetTransformForMode("full");
    else if (mode === "magnify" || mode === "pinch") resetTransformForMode("magnify");
  }, [activeIndex, mode, resetTransformForMode, url]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        onInteraction();
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

      if (e.touches.length === 1 && touchRef.current && canSingleFingerPan(scaleRef.current)) {
        const t = e.touches[0];
        const touch = touchRef.current;
        if (Math.hypot(t.clientX - touch.x, t.clientY - touch.y) > 8) {
          touch.moved = true;
          touch.panning = true;
          onInteraction();
        }
        if (touch.panning) {
          e.preventDefault();
          applyTransform(
            scaleRef.current,
            touch.tx + (t.clientX - touch.x),
            touch.ty + (t.clientY - touch.y),
          );
        }
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [applyTransform, onInteraction]);

  const stepBack = useCallback(
    (fromBackdrop: boolean) => {
      if (suppressTapRef.current) return;
      if (mode === "pinch" || isPinchBeyondMagnify(scaleRef.current)) {
        resetTransformForMode("magnify");
        onModeChange("magnify");
        return;
      }
      if (mode === "magnify") {
        resetTransformForMode("full");
        steppedBackToFullRef.current = true;
        onModeChange("full");
        return;
      }
      if (mode === "full") {
        if (fromBackdrop || steppedBackToFullRef.current) {
          steppedBackToFullRef.current = false;
          onClose();
          return;
        }
        resetTransformForMode("magnify");
        onModeChange("magnify");
      }
    },
    [mode, onClose, onModeChange, resetTransformForMode, suppressTapRef],
  );

  const handleImageTap = useCallback(() => {
    stepBack(false);
  }, [stepBack]);

  const onBackdropClick = useCallback(() => {
    stepBack(true);
  }, [stepBack]);

  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      if (mode === "full") {
        resetTransformForMode("magnify");
        onModeChange("magnify");
      }
      onInteraction();
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
        suppressClickRef.current = true;
      } else if (touch) {
        suppressClickRef.current = true;
        handleImageTap();
      }
      touchRef.current = null;
    }
  };

  const onImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClickRef.current || suppressTapRef.current) {
      suppressClickRef.current = false;
      return;
    }
    handleImageTap();
  };

  const navigate = (index: number) => {
    if (mode !== "full") return;
    steppedBackToFullRef.current = false;
    onInteraction();
    const n = images.length;
    if (n === 0) return;
    const i = ((index % n) + n) % n;
    onIndexChange(i);
    onModeChange("full");
  };

  const canNavigate = mode === "full" && images.length > 1;
  const allowsTouchPan = mode === "magnify" || mode === "pinch";

  if (mode === "cover" || !url || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[105]"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onBackdropClick}
    >
      <div className="absolute inset-0 bg-ink/72 backdrop-blur-[2px]" aria-hidden />
      <div className="relative flex h-full w-full items-center justify-center p-4 pointer-events-none">
        <div className="relative flex h-[min(88vh,900px)] w-[min(96vw,900px)] max-w-full items-center justify-center">
          {canNavigate ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(activeIndex - 1);
                }}
                className="pointer-events-auto absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink/45 text-paper shadow-sm backdrop-blur-sm transition hover:bg-ink/60"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(activeIndex + 1);
                }}
                className="pointer-events-auto absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink/45 text-paper shadow-sm backdrop-blur-sm transition hover:bg-ink/60"
                aria-label="Next image"
              >
                <ChevronRight size={24} strokeWidth={2} />
              </button>
            </>
          ) : null}

          <div
            ref={stageRef}
            className={`pointer-events-auto relative h-full w-full max-h-full max-w-full ${
              mode === "full" ? "cursor-zoom-in" : "cursor-zoom-out"
            }`}
            style={{ touchAction: allowsTouchPan ? "none" : "auto" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onClick={onImageClick}
          >
            <div
              className="relative mx-auto h-full w-full will-change-transform"
              style={{
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                transformOrigin: "center center",
              }}
            >
              <StorefrontImage
                src={url}
                alt={`${alt} — ${activeIndex + 1}`}
                fill
                draggable={false}
                priority
                className="pointer-events-none object-contain object-center select-none"
                sizes="96vw"
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
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
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suppressTapRef = useRef(false);
  const touchSessionRef = useRef<{ startScrollLeft: number } | null>(null);
  const skipViewResetRef = useRef(false);
  const [active, setActive] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("cover");

  const urls = useMemo(
    () => mediaUrls.map((x) => x.trim()).filter(Boolean),
    [mediaUrls],
  );
  const imageUrls = useMemo(
    () => urls.filter((url) => !isWholesaleVideoUrl(url)),
    [urls],
  );
  const imageIndices = useMemo(
    () =>
      urls
        .map((url, i) => (isWholesaleVideoUrl(url) ? -1 : i))
        .filter((i) => i >= 0),
    [urls],
  );
  const posterUrl = useMemo(() => wholesaleListingPosterUrl(urls), [urls]);
  const urlsKey = useMemo(() => urls.join("\0"), [urls]);

  const isLightboxOpen = viewMode !== "cover";
  const canSwipeCarousel = viewMode === "cover";

  const openFullAt = useCallback(
    (index: number) => {
      if (isWholesaleVideoUrl(urls[index] ?? "")) return;
      setViewMode("full");
      if (index !== active) {
        skipViewResetRef.current = true;
        setActive(index);
        slideRefs.current[index]?.scrollIntoView({
          behavior: "auto",
          inline: "start",
          block: "nearest",
        });
      }
    },
    [active, urls],
  );

  const closeLightbox = useCallback(() => {
    setViewMode("cover");
  }, []);

  const scrollTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (!canSwipeCarousel) return;
      if (urls.length === 0) return;
      const i = ((index % urls.length) + urls.length) % urls.length;
      slideRefs.current[i]?.scrollIntoView({
        behavior,
        inline: "start",
        block: "nearest",
      });
      setActive(i);
    },
    [canSwipeCarousel, urls.length],
  );

  const onScroll = useCallback(() => {
    if (!canSwipeCarousel) return;
    const el = scrollerRef.current;
    if (!el || urls.length === 0) return;
    const session = touchSessionRef.current;
    if (session && Math.abs(el.scrollLeft - session.startScrollLeft) > SCROLL_NAV_THRESHOLD_PX) {
      suppressTapRef.current = true;
    }
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    const next = Math.min(Math.max(i, 0), urls.length - 1);
    setActive((current) => (current === next ? current : next));
  }, [canSwipeCarousel, urls.length]);

  const onLightboxIndexChange = useCallback(
    (imageIndex: number) => {
      const carouselIndex = imageIndices[imageIndex];
      if (carouselIndex === undefined) return;
      skipViewResetRef.current = true;
      setActive(carouselIndex);
      slideRefs.current[carouselIndex]?.scrollIntoView({
        behavior: "auto",
        inline: "start",
        block: "nearest",
      });
    },
    [imageIndices],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setActive(0);
      setViewMode("cover");
      slideRefs.current[0]?.scrollIntoView({
        behavior: "auto",
        inline: "start",
        block: "nearest",
      });
    });
  }, [urlsKey]);

  useEffect(() => {
    if (skipViewResetRef.current) {
      skipViewResetRef.current = false;
      return;
    }
    if (viewMode === "pinch") setViewMode("magnify");
  }, [active, viewMode]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeLightbox();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [closeLightbox, isLightboxOpen]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !canSwipeCarousel) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      suppressTapRef.current = false;
      touchSessionRef.current = { startScrollLeft: el.scrollLeft };
    };

    const onTouchEnd = () => {
      touchSessionRef.current = null;
      requestAnimationFrame(() => {
        suppressTapRef.current = false;
      });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [canSwipeCarousel]);

  if (urls.length === 0) return null;

  const activeImageIndex = imageIndices.indexOf(active);
  const lightboxImageIndex = activeImageIndex >= 0 ? activeImageIndex : 0;

  return (
    <div className="relative min-w-0 max-w-full">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-paper shadow-card">
        <div className="relative">
          <div
            ref={scrollerRef}
            className={`flex scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              canSwipeCarousel ? "overflow-x-auto" : "overflow-x-hidden"
            }`}
          >
            {urls.map((src, i) => (
              <div
                key={`${i}-${src}`}
                ref={(node) => {
                  slideRefs.current[i] = node;
                }}
                className="relative aspect-square w-full shrink-0 basis-full snap-start snap-always"
              >
                {isWholesaleVideoUrl(src) ? (
                  <WholesaleVideoSlide url={src} alt={`${alt} — ${i + 1}`} />
                ) : (
                  <WholesaleCoverImageSlide
                    url={src}
                    alt={`${alt} — ${i + 1}`}
                    priority={i === 0}
                    onOpenFull={() => openFullAt(i)}
                  />
                )}
              </div>
            ))}
          </div>

          {urls.length > 1 && viewMode === "cover" ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollTo(active - 1);
                }}
                className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollTo(active + 1);
                }}
                className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Next"
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <WholesaleCenterLightbox
        images={imageUrls}
        alt={alt}
        activeIndex={lightboxImageIndex}
        mode={viewMode}
        onModeChange={setViewMode}
        onIndexChange={onLightboxIndexChange}
        onClose={closeLightbox}
        suppressTapRef={suppressTapRef}
        onInteraction={() => {}}
      />

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
