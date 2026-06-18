"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { StorefrontProductGridTile } from "@/components/site/storefront-product-grid-tile";
import { attachForwardVerticalWheel } from "@/lib/forward-vertical-wheel";
import type { Product } from "@/lib/catalog";

type ScrollMetrics = {
  canScroll: boolean;
  thumbRatio: number;
  thumbOffset: number;
};

const ITEM_CLASS =
  "w-[calc(50%-0.5rem)] min-w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-[calc(25%-0.75rem)] sm:min-w-[calc(25%-0.75rem)]";

const MIN_THUMB_RATIO = 0.06;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function visualThumbRatio(ratio: number) {
  return Math.max(ratio, MIN_THUMB_RATIO);
}

function leadingItemIndex(scroller: HTMLElement): number {
  const x = scroller.scrollLeft + 2;
  const children = scroller.children;
  let index = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    if (child.offsetLeft <= x) index = i;
    else break;
  }
  return index;
}

function scrollToItemIndex(scroller: HTMLElement, index: number) {
  const child = scroller.children[index] as HTMLElement | undefined;
  if (!child) return;
  scroller.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
}

function RecommendedProductsScrollSlider({
  thumbRatio,
  thumbOffset,
  scrollLabel,
  onThumbOffset,
  onDraggingChange,
}: {
  thumbRatio: number;
  thumbOffset: number;
  scrollLabel: string;
  onThumbOffset: (offset: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRatioRef = useRef(thumbRatio);
  const thumbOffsetRef = useRef(thumbOffset);
  const dragRef = useRef<{ pointerId: number; startX: number; startOffset: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  thumbRatioRef.current = thumbRatio;
  thumbOffsetRef.current = thumbOffset;

  const offsetFromPointer = useCallback((clientX: number, startOffset: number, startX: number) => {
    const track = trackRef.current;
    if (!track) return startOffset;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return startOffset;
    const visualRatio = visualThumbRatio(thumbRatioRef.current);
    const maxTravel = rect.width * (1 - visualRatio);
    if (maxTravel <= 0) return startOffset;
    const deltaOffset = (clientX - startX) / maxTravel;
    return clamp01(startOffset + deltaOffset);
  }, []);

  const jumpToPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickRatio = (clientX - rect.left) / rect.width;
      const visualRatio = visualThumbRatio(thumbRatioRef.current);
      onThumbOffset(clamp01(clickRatio - visualRatio / 2));
    },
    [onThumbOffset],
  );

  const onTrackRailPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    jumpToPointer(event.clientX);
  };

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: thumbOffsetRef.current,
    };
    setDragging(true);
    onDraggingChange(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onSliderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onThumbOffset(offsetFromPointer(event.clientX, drag.startOffset, drag.startX));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    onDraggingChange(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const thumbWidthPct = visualThumbRatio(thumbRatio) * 100;
  const travelPct = 100 - thumbWidthPct;

  return (
    <div className="mt-6 w-full px-10 sm:mt-8 sm:px-12">
      <div ref={trackRef} className="relative h-9 touch-none select-none sm:h-10">
        <div
          role="presentation"
          aria-hidden
          onPointerDown={onTrackRailPointerDown}
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 cursor-pointer rounded-full bg-ink/5 shadow-[inset_0_1px_2px_rgb(15_17_20/0.06)] ring-1 ring-inset ring-white/50"
        />

        <div
          role="slider"
          aria-label={scrollLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(thumbOffset * 100)}
          tabIndex={0}
          data-slider-thumb="true"
          onPointerDown={onThumbPointerDown}
          onPointerMove={onSliderPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            const step = 0.08;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              onThumbOffset(clamp01(thumbOffset - step));
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              onThumbOffset(clamp01(thumbOffset + step));
            }
          }}
          className={`absolute top-1/2 flex h-[18px] min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-linear-to-b from-[#e3e1db] to-[#d0cec8] shadow-[0_1px_2px_rgb(15_17_20/0.06),0_2px_8px_rgb(15_17_20/0.05)] outline-none focus-visible:ring-2 focus-visible:ring-ink/15 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:h-5 ${
            dragging
              ? "cursor-grabbing border-ink/15 shadow-[0_2px_10px_rgb(15_17_20/0.1)]"
              : "cursor-grab hover:border-ink/15 hover:from-[#dedad4] hover:to-[#c8c6c0]"
          }`}
          style={{
            width: `${thumbWidthPct}%`,
            left: `${thumbOffset * travelPct}%`,
            willChange: dragging ? "left" : undefined,
          }}
        >
          <span
            aria-hidden
            className="h-px w-[38%] max-w-7 rounded-full bg-ink/15"
          />
        </div>
      </div>
    </div>
  );
}

export function HomeRecommendedProductsSlider({
  products,
  cardImages,
  prevLabel,
  nextLabel,
  scrollLabel,
  cartSource = "home_recommended",
}: {
  products: Product[];
  cardImages: (string | undefined)[];
  prevLabel: string;
  nextLabel: string;
  scrollLabel: string;
  cartSource?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [dragThumbOffset, setDragThumbOffset] = useState<number | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({
    canScroll: false,
    thumbRatio: 1,
    thumbOffset: 0,
  });

  const readScrollMetrics = useCallback((el: HTMLElement): ScrollMetrics => {
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth - clientWidth;
    const canScroll = overflow > 2;
    const thumbRatio = canScroll ? clientWidth / scrollWidth : 1;
    const thumbOffset = canScroll && overflow > 0 ? scrollLeft / overflow : 0;
    return { canScroll, thumbRatio, thumbOffset };
  }, []);

  const updateScrollState = useCallback(() => {
    if (draggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    setScrollMetrics(readScrollMetrics(el));
  }, [readScrollMetrics]);

  const applyThumbOffset = useCallback(
    (offset: number, fromDrag = false) => {
      const el = scrollerRef.current;
      if (!el) return;
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow <= 0) return;
      const clamped = clamp01(offset);
      el.scrollLeft = clamped * overflow;
      if (fromDrag) {
        setDragThumbOffset(clamped);
        return;
      }
      setDragThumbOffset(null);
      setScrollMetrics((prev) => ({ ...prev, thumbOffset: clamped }));
    },
    [],
  );

  const scrollByItem = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el || el.children.length === 0) return;
    const current = leadingItemIndex(el);
    const next = Math.max(0, Math.min(el.children.length - 1, current + direction));
    scrollToItemIndex(el, next);
  }, []);

  const onDraggingChange = useCallback(
    (dragging: boolean) => {
      draggingRef.current = dragging;
      setSliderDragging(dragging);
      if (!dragging) {
        setDragThumbOffset(null);
        updateScrollState();
      }
    },
    [updateScrollState],
  );

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    const detachWheel = attachForwardVerticalWheel(el);

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      detachWheel();
    };
  }, [products.length, updateScrollState]);

  if (products.length === 0) return null;

  const { canScroll } = scrollMetrics;
  const displayThumbOffset = dragThumbOffset ?? scrollMetrics.thumbOffset;

  return (
    <div className="relative mt-10">
      <div
        ref={scrollerRef}
        className={`flex gap-4 overflow-x-auto px-10 pb-1 sm:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          sliderDragging ? "snap-none scroll-auto" : "snap-x snap-mandatory scroll-smooth"
        }`}
      >
        {products.map((product, i) => (
          <div key={product.slug} className={ITEM_CLASS}>
            <StorefrontProductGridTile
              product={product}
              cardImageUrl={cardImages[i]}
              imagePriority={i < 4}
              imageEager={i < 6}
              cartSource={cartSource}
            />
          </div>
        ))}
      </div>

      {canScroll ? (
        <>
          <button
            type="button"
            onClick={() => scrollByItem(-1)}
            className="absolute left-0 top-[38%] z-10 inline-flex -translate-y-1/2 rounded-full border border-line/80 bg-paper/95 p-2 text-ink/70 shadow-sm backdrop-blur-sm transition hover:bg-paper hover:text-ink"
            aria-label={prevLabel}
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByItem(1)}
            className="absolute right-0 top-[38%] z-10 inline-flex -translate-y-1/2 rounded-full border border-line/80 bg-paper/95 p-2 text-ink/70 shadow-sm backdrop-blur-sm transition hover:bg-paper hover:text-ink"
            aria-label={nextLabel}
          >
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
          </button>

          <RecommendedProductsScrollSlider
            thumbRatio={scrollMetrics.thumbRatio}
            thumbOffset={displayThumbOffset}
            scrollLabel={scrollLabel}
            onThumbOffset={(offset) => applyThumbOffset(offset, draggingRef.current)}
            onDraggingChange={onDraggingChange}
          />
        </>
      ) : null}
    </div>
  );
}
