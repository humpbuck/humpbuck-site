"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { attachForwardVerticalWheel } from "@/lib/forward-vertical-wheel";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

type ScrollMetrics = {
  canScroll: boolean;
  thumbRatio: number;
  thumbOffset: number;
};

const MIN_THUMB_RATIO = 0.14;

type Props = {
  children: ReactNode;
  className?: string;
  scrollerClassName?: string;
  railClassName?: string;
  scrollLabel: string;
  scrollerProps?: HTMLAttributes<HTMLDivElement>;
};

/** Horizontal scroller with a thin rail so overflow is obvious on touch devices. */
export function SubtleHorizontalScroll({
  children,
  className,
  scrollerClassName,
  railClassName,
  scrollLabel,
  scrollerProps,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
  } | null>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    canScroll: false,
    thumbRatio: 1,
    thumbOffset: 0,
  });
  const [dragging, setDragging] = useState(false);

  const readMetrics = useCallback((el: HTMLElement): ScrollMetrics => {
    const overflow = el.scrollWidth - el.clientWidth;
    const canScroll = overflow > 2;
    return {
      canScroll,
      thumbRatio: canScroll ? el.clientWidth / el.scrollWidth : 1,
      thumbOffset: canScroll && overflow > 0 ? el.scrollLeft / overflow : 0,
    };
  }, []);

  const updateMetrics = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || dragRef.current) return;
    setMetrics(readMetrics(el));
  }, [readMetrics]);

  const applyOffset = useCallback((offset: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow <= 0) return;
    const clamped = clamp01(offset);
    el.scrollLeft = clamped * overflow;
    setMetrics((prev) => ({ ...prev, thumbOffset: clamped }));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(el);
    el.addEventListener("scroll", updateMetrics, { passive: true });
    window.addEventListener("resize", updateMetrics);
    const detachWheel = attachForwardVerticalWheel(el);

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateMetrics);
      window.removeEventListener("resize", updateMetrics);
      detachWheel();
    };
  }, [updateMetrics]);

  useEffect(() => {
    updateMetrics();
  }, [children, updateMetrics]);

  const visualRatio = Math.max(metrics.thumbRatio, MIN_THUMB_RATIO);
  const thumbWidthPct = visualRatio * 100;
  const travelPct = 100 - thumbWidthPct;

  const offsetFromPointer = useCallback(
    (clientX: number, startOffset: number, startX: number) => {
      const track = trackRef.current;
      if (!track) return startOffset;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return startOffset;
      const maxTravel = rect.width * (1 - visualRatio);
      if (maxTravel <= 0) return startOffset;
      return clamp01(startOffset + (clientX - startX) / maxTravel);
    },
    [visualRatio],
  );

  const jumpToPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickRatio = (clientX - rect.left) / rect.width;
      applyOffset(clickRatio - visualRatio / 2);
    },
    [applyOffset, visualRatio],
  );

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    jumpToPointer(event.clientX);
  };

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: metrics.thumbOffset,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    applyOffset(offsetFromPointer(event.clientX, drag.startOffset, drag.startX));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    updateMetrics();
  };

  const {
    className: scrollerPropClassName,
    ...restScrollerProps
  } = scrollerProps ?? {};

  return (
    <div className={className}>
      <div
        ref={scrollerRef}
        {...restScrollerProps}
        className={`flex overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${scrollerClassName ?? ""} ${scrollerPropClassName ?? ""}`}
      >
        {children}
      </div>

      {metrics.canScroll ? (
        <div
          ref={trackRef}
          className={`relative mt-2 h-3 touch-none select-none ${railClassName ?? ""}`}
        >
          <div
            role="presentation"
            aria-hidden
            onPointerDown={onTrackPointerDown}
            className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 cursor-pointer rounded-full bg-ink/10"
          />
          <div
            role="slider"
            aria-label={scrollLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(metrics.thumbOffset * 100)}
            tabIndex={0}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(event) => {
              const step = 0.12;
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                applyOffset(metrics.thumbOffset - step);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                applyOffset(metrics.thumbOffset + step);
              }
            }}
            className={`absolute top-1/2 h-[5px] min-w-8 -translate-y-1/2 rounded-full bg-ink/40 outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
              dragging ? "cursor-grabbing bg-ink/55" : "cursor-grab hover:bg-ink/50"
            }`}
            style={{
              width: `${thumbWidthPct}%`,
              left: `${metrics.thumbOffset * travelPct}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
