"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";
import { Link } from "@/i18n/navigation";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import {
  heroMinH,
  HomeHeroImageLayer,
} from "@/components/site/home-hero-image-layer";
import type { HumpbuckSocialId } from "@/lib/humpbuck-social";

export const HOME_HERO_ROTATE_MS = 3000;

export type HomeHeroSlide = {
  id: string;
  badge: string;
  title: string;
  lead: string;
  chips: string[];
  cta: string;
  ctaHref: "/products" | "/products/automatic";
  alt: string;
  mobileSrc?: string;
  desktopSrc?: string;
  headingAs: "h1" | "h2";
};

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

function HeroSlideCopy({
  slide,
  socialLabels,
}: {
  slide: HomeHeroSlide;
  socialLabels: Record<HumpbuckSocialId, string>;
}) {
  const Heading = slide.headingAs;

  return (
    <div className="flex flex-col">
      <p className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 md:tracking-[0.2em]">
        {slide.badge}
      </p>

      <Heading
        id={slide.headingAs === "h1" ? "home-hero-heading" : undefined}
        className="mt-4 font-serif text-[clamp(1.75rem,5vw+0.5rem,3.25rem)] font-normal leading-[1.15] tracking-[-0.02em] md:mt-5 md:leading-[1.08]"
      >
        {slide.title}
      </Heading>

      <p className="mt-5 max-w-[min(100%,24rem)] text-[clamp(0.9375rem,2.5vw,1.0625rem)] leading-[1.75] text-white/86 md:mt-6 md:max-w-prose md:text-lg md:leading-[1.7] md:text-white/82">
        {slide.lead}
      </p>

      <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
        {slide.chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-[clamp(2.75rem,9svh,4.5rem)] flex flex-col items-start gap-3.5 sm:flex-row sm:flex-wrap sm:items-center md:mt-10 md:gap-5">
        <Link
          href={slide.ctaHref}
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#080808] transition hover:bg-white/90 md:px-7 md:py-2.5 md:text-xs"
        >
          {slide.cta}
        </Link>
        <HumpbuckSocialLinks variant="hero" labels={socialLabels} />
      </div>
    </div>
  );
}

export function HomeHeroCarousel({
  slides,
  socialLabels,
  goToLabel,
  carouselLabel,
}: {
  slides: HomeHeroSlide[];
  socialLabels: Record<HumpbuckSocialId, string>;
  goToLabel: string;
  carouselLabel: string;
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
  const autoplayPaused =
    hoverPaused || hiddenPaused || reducedMotion || count <= 1;

  const goTo = useCallback(
    (next: number) => {
      if (count <= 1) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (autoplayPaused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, HOME_HERO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, count]);

  useEffect(() => {
    const onVisibility = () => setHiddenPaused(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const fromControl = (event.target as HTMLElement | null)?.closest(
      "a, button",
    );
    if (fromControl) return;
    const target = event.currentTarget;
    target.dataset.heroPointerX = String(event.clientX);
    target.dataset.heroPointerY = String(event.clientY);
  }, []);

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const startX = Number(target.dataset.heroPointerX ?? "");
      const startY = Number(target.dataset.heroPointerY ?? "");
      delete target.dataset.heroPointerX;
      delete target.dataset.heroPointerY;
      if (!Number.isFinite(startX) || !Number.isFinite(startY)) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      goTo(index + (dx < 0 ? 1 : -1));
    },
    [goTo, index],
  );

  const slide1Override =
    Boolean(slides[0]?.mobileSrc?.trim()) ||
    Boolean(slides[0]?.desktopSrc?.trim());

  return (
    <div
      className="absolute inset-0 flex flex-col"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      role="region"
      aria-roledescription="carousel"
      aria-label={carouselLabel}
    >
      {slide1Override ? (
        <div
          className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${
            index === 0 ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== 0}
        >
          <HomeHeroImageLayer
            mobileSrc={slides[0]?.mobileSrc}
            desktopSrc={slides[0]?.desktopSrc}
            alt={slides[0]?.alt ?? ""}
            priority={false}
          />
        </div>
      ) : null}

      {slides.slice(1).map((slide, slideOffset) => {
        const slideIndex = slideOffset + 1;
        const active = index === slideIndex;
        return (
          <div
            key={`image-${slide.id}`}
            className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!active}
          >
            <HomeHeroImageLayer
              mobileSrc={slide.mobileSrc}
              desktopSrc={slide.desktopSrc}
              alt={slide.alt}
              priority={false}
            />
          </div>
        );
      })}

      <div
        className={`relative z-10 mx-auto flex min-h-0 flex-1 flex-col ${heroMinH} w-full max-w-7xl px-[clamp(1rem,4.5vw,1.75rem)] pt-[clamp(3.5rem,12svh,5.5rem)] pb-[clamp(1.5rem,4svh,2.5rem)] md:px-6 md:py-0 lg:px-8`}
      >
        <div className="hidden shrink-0 md:block md:flex-[2]" aria-hidden />

        <div className="relative mt-0 w-full max-w-xl shrink-0 md:my-0">
          {slides.map((slide, slideIndex) => {
            const active = index === slideIndex;
            return (
              <div
                key={slide.id}
                className={`${
                  slideIndex === 0 ? "relative" : "absolute inset-0"
                } transition-opacity duration-700 ease-in-out ${
                  active ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-hidden={!active}
              >
                <HeroSlideCopy slide={slide} socialLabels={socialLabels} />
              </div>
            );
          })}
        </div>

        <div className="hidden shrink-0 md:block md:flex-[3]" aria-hidden />
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-[clamp(5.25rem,11svh,6.5rem)] z-20 flex justify-center">
          <div className="flex items-center gap-2" role="tablist" aria-label={carouselLabel}>
            {slides.map((slide, slideIndex) => {
              const active = index === slideIndex;
              return (
                <button
                  key={`dot-${slide.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${goToLabel} ${slideIndex + 1}`}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                    active ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  onClick={() => goTo(slideIndex)}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
