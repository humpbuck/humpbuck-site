"use client";

import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StorefrontImage } from "@/components/site/storefront-image";
import { attachForwardVerticalWheel } from "@/lib/forward-vertical-wheel";
import type { HomeBlogDualCarouselItem } from "@/lib/home-blog-carousel";

const CARD_WIDTH = "w-[calc(50%-0.5rem)]";

function chunkPages(items: HomeBlogDualCarouselItem[]): HomeBlogDualCarouselItem[][] {
  const pages: HomeBlogDualCarouselItem[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pages.push(items.slice(i, i + 2));
  }
  return pages;
}

function leadingPageIndex(scroller: HTMLElement): number {
  const w = Math.max(scroller.clientWidth, 1);
  return Math.min(Math.round(scroller.scrollLeft / w), scroller.children.length - 1);
}

function scrollToPageIndex(scroller: HTMLElement, index: number) {
  const w = Math.max(scroller.clientWidth, 1);
  const i = Math.max(0, Math.min(index, scroller.children.length - 1));
  scroller.scrollTo({ left: i * w, behavior: "smooth" });
}

function BlogStaggerCard({
  item,
  stagger,
  eager,
}: {
  item: HomeBlogDualCarouselItem;
  stagger: "high" | "low";
  eager: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex flex-col ${CARD_WIDTH} ${
        stagger === "high" ? "self-start" : "mt-10 self-start sm:mt-14 lg:mt-20"
      }`}
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
        <div className="relative aspect-square overflow-hidden bg-ink/4">
          <StorefrontImage
            src={item.src}
            alt={item.alt}
            fill
            loading={eager ? "eager" : "lazy"}
            className="object-cover object-center transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 384px"
          />
        </div>
      </div>
      <p className="mt-4 text-center font-serif text-base leading-snug text-ink transition group-hover:text-ink/85 sm:text-lg">
        {item.title}
      </p>
      {item.excerpt.trim() ? (
        <p className="mt-2 line-clamp-2 text-center text-sm leading-relaxed text-muted">
          {item.excerpt}
        </p>
      ) : null}
    </Link>
  );
}

type HomeBlogDualCarouselProps = {
  items: HomeBlogDualCarouselItem[];
  title: string;
  viewAllLabel: string;
  previousLabel: string;
  nextLabel: string;
};

export function HomeBlogDualCarousel({
  items,
  title,
  viewAllLabel,
  previousLabel,
  nextLabel,
}: HomeBlogDualCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const pages = useMemo(() => chunkPages(items), [items]);
  const pagesKey = useMemo(() => pages.map((p) => p.map((i) => i.href).join("|")).join("\0"), [pages]);

  const syncScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || pages.length === 0) return;
    const page = leadingPageIndex(el);
    setActivePage(page);
    setCanScrollBack(page > 0);
    setCanScrollForward(page < pages.length - 1);
  }, [pages.length]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;
      scrollToPageIndex(el, leadingPageIndex(el) + direction);
    },
    [],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncScrollState, { passive: true });
    const detachWheel = attachForwardVerticalWheel(el);
    syncScrollState();
    return () => {
      el.removeEventListener("scroll", syncScrollState);
      detachWheel();
    };
  }, [pagesKey, syncScrollState]);

  useEffect(() => {
    queueMicrotask(() => {
      scrollerRef.current?.scrollTo({ left: 0, behavior: "auto" });
      setActivePage(0);
      syncScrollState();
    });
  }, [pagesKey, syncScrollState]);

  if (items.length === 0) return null;

  const showControls = pages.length > 1;

  return (
    <div className="min-w-0">
      <div className="mb-8 text-center sm:mb-10">
        <h2
          id="home-blog-carousel-heading"
          className="font-serif text-2xl tracking-tight text-ink sm:text-3xl lg:text-4xl"
        >
          {title}
        </h2>
        <Link
          href="/blog"
          className="mt-4 inline-flex text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55 transition hover:text-ink"
        >
          {viewAllLabel}
        </Link>
      </div>

      <div className="relative min-w-0">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory scroll-smooth overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pages.map((pageItems, pageIndex) => (
            <div
              key={pageItems.map((p) => p.href).join("|")}
              className="flex min-h-[min(520px,90vw)] w-full min-w-full shrink-0 snap-start snap-always items-start justify-between gap-4 px-0.5 pb-2 sm:min-h-[580px] lg:min-h-[640px]"
            >
              {pageItems[0] ? (
                <BlogStaggerCard
                  item={pageItems[0]}
                  stagger="high"
                  eager={pageIndex === 0}
                />
              ) : null}
              {pageItems[1] ? (
                <BlogStaggerCard
                  item={pageItems[1]}
                  stagger="low"
                  eager={pageIndex === 0}
                />
              ) : null}
            </div>
          ))}
        </div>

        {showControls ? (
          <>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canScrollBack}
              className="absolute left-0 top-[38%] z-10 -translate-y-1/2 rounded-full border border-line/80 bg-paper/95 p-2 text-ink/70 shadow-sm backdrop-blur-sm transition hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-30 sm:-left-3 sm:p-2.5"
              aria-label={previousLabel}
            >
              <ChevronLeft size={20} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canScrollForward}
              className="absolute right-0 top-[38%] z-10 -translate-y-1/2 rounded-full border border-line/80 bg-paper/95 p-2 text-ink/70 shadow-sm backdrop-blur-sm transition hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-30 sm:-right-3 sm:p-2.5"
              aria-label={nextLabel}
            >
              <ChevronRight size={20} strokeWidth={1.75} />
            </button>
            <div className="mt-6 flex justify-center gap-1.5">
              {pages.map((pageItems, index) => (
                <button
                  key={pageItems.map((p) => p.href).join("|")}
                  type="button"
                  onClick={() => {
                    const el = scrollerRef.current;
                    if (el) scrollToPageIndex(el, index);
                  }}
                  aria-current={activePage === index ? "true" : undefined}
                  aria-label={`${index + 1} / ${pages.length}`}
                  className={`h-1.5 rounded-full transition-all ${
                    activePage === index ? "w-6 bg-ink" : "w-1.5 bg-ink/20"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
