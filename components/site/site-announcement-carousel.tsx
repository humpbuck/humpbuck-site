"use client";

import { Link } from "@/i18n/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  SITE_ANNOUNCEMENT_BAR_HEIGHT_PX,
  SITE_ANNOUNCEMENT_ROTATE_MS,
  type SiteAnnouncementSlide,
} from "@/lib/site-announcement";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function AnnouncementSlideLine({
  slide,
  textColor,
}: {
  slide: SiteAnnouncementSlide;
  textColor: string;
}) {
  const className =
    "flex h-[var(--site-announcement-bar-h)] items-center justify-center px-4 text-center text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px]";
  const style = { color: textColor };

  const text = (
    <span className="line-clamp-2 max-w-full leading-snug">{slide.message}</span>
  );

  if (!slide.href.trim()) {
    return (
      <p className={className} style={style}>
        {text}
      </p>
    );
  }

  if (isExternalHref(slide.href)) {
    return (
      <a
        href={slide.href.trim()}
        className={`${className} hover:opacity-90`}
        style={style}
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  }

  return (
    <Link
      href={slide.href.trim()}
      className={`${className} hover:opacity-90`}
      style={style}
    >
      {text}
    </Link>
  );
}

export function SiteAnnouncementCarousel({
  slides,
  textColor,
}: {
  slides: SiteAnnouncementSlide[];
  textColor: string;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [hiddenPaused, setHiddenPaused] = useState(false);
  const count = slides.length;
  const autoplayPaused = hoverPaused || hiddenPaused || reducedMotion || count <= 1;

  const loopSlides = useMemo(() => {
    if (count <= 1) return slides;
    return [...slides, slides[0]!];
  }, [count, slides]);

  const advance = useCallback(() => {
    setIndex((current) => {
      if (count <= 1) return 0;
      if (current >= count) return 0;
      return current + 1;
    });
  }, [count]);

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    if (autoplayPaused || count <= 1) return;
    const timer = window.setInterval(advance, SITE_ANNOUNCEMENT_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advance, autoplayPaused, count]);

  useEffect(() => {
    const onVisibility = () => setHiddenPaused(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (count <= 1 || index !== count) return;
    const timer = window.setTimeout(() => setIndex(0), 500);
    return () => window.clearTimeout(timer);
  }, [count, index]);

  const translateY = -(index * SITE_ANNOUNCEMENT_BAR_HEIGHT_PX);
  const animate = count > 1 && index !== count;

  return (
    <div
      className="overflow-hidden"
      style={{
        height: SITE_ANNOUNCEMENT_BAR_HEIGHT_PX,
        ["--site-announcement-bar-h" as string]: `${SITE_ANNOUNCEMENT_BAR_HEIGHT_PX}px`,
      }}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={animate ? "transition-transform duration-500 ease-in-out" : ""}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {loopSlides.map((slide, slideIndex) => (
          <AnnouncementSlideLine
            key={`${slide.message}-${slide.href}-${slideIndex}`}
            slide={slide}
            textColor={textColor}
          />
        ))}
      </div>
    </div>
  );
}
