"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [loadFailed, setLoadFailed] = useState<Set<string>>(() => new Set());
  /** If every `next/image` failed (e.g. domain not in `remotePatterns`), last-resort plain `<img>`. */
  const [rawFallbackFailed, setRawFallbackFailed] = useState(false);
  const imagesKey = useMemo(() => images.join("\0"), [images]);

  useEffect(() => {
    setLoadFailed(new Set());
    setActive(0);
    setRawFallbackFailed(false);
  }, [imagesKey]);

  const visible = useMemo(
    () => images.filter((src) => !loadFailed.has(src)),
    [images, loadFailed],
  );
  const visibleKey = useMemo(() => visible.join("\0"), [visible]);

  const markFailed = useCallback((src: string) => {
    setLoadFailed((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const n = visible.length;
      if (n === 0) return;
      const i = ((index % n) + n) % n;
      const w = el.clientWidth;
      el.scrollTo({ left: i * w, behavior: "smooth" });
      setActive(i);
    },
    [visible.length],
  );

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !visible.length) return;
    const w = Math.max(el.clientWidth, 1);
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(i, visible.length - 1));
  }, [visible.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || visible.length === 0) return;
    setActive((a) => {
      const i = Math.min(Math.max(a, 0), visible.length - 1);
      const w = el.clientWidth;
      requestAnimationFrame(() => {
        el.scrollTo({ left: i * w, behavior: "auto" });
      });
      return i;
    });
  }, [visibleKey, visible.length]);

  if (images.length === 0) return null;
  if (visible.length === 0) {
    if (rawFallbackFailed) {
      return (
        <div
          className="relative min-w-0 max-w-full rounded-[28px] border border-dashed border-[color:var(--color-line)] bg-paper/80 p-8 text-center text-sm leading-relaxed text-muted"
          role="status"
        >
          无法加载商品图。若公网图使用自定义域名，请把该域名加入{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[12px] text-ink/80">
            next.config → images.remotePatterns
          </code>{" "}
          并确保{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[12px] text-ink/80">
            NEXT_PUBLIC_R2_PUBLIC_BASE
          </code>{" "}
          与线上 R2 一致后重新部署。
        </div>
      );
    }
    return (
      <div className="relative min-w-0 max-w-full">
        <div
          className={`pointer-events-none absolute -inset-3 rounded-[32px] bg-gradient-to-br sm:-inset-6 ${themeGlowClass} blur-2xl opacity-70`}
        />
        <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--color-line)] bg-paper shadow-[var(--shadow-card)]">
          <div className="relative aspect-square w-full">
            <img
              src={images[0]}
              alt={alt}
              className="h-full w-full object-cover object-center"
              loading="eager"
              onError={() => setRawFallbackFailed(true)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 max-w-full">
      <div
        className={`pointer-events-none absolute -inset-3 rounded-[32px] bg-gradient-to-br sm:-inset-6 ${themeGlowClass} blur-2xl opacity-70`}
      />
      <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--color-line)] bg-paper shadow-[var(--shadow-card)]">
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visible.map((src, i) => (
              <div
                key={src}
                className="relative aspect-square w-full min-w-full shrink-0 snap-center"
              >
                <Image
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:1024px) 100vw, 50vw"
                  priority={i === 0}
                  onError={() => markFailed(src)}
                />
              </div>
            ))}
          </div>
          {visible.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollTo(active - 1)}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(active + 1)}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>

      {visible.length > 1 && (
        <>
          <div className="mt-4 flex w-full max-w-full justify-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visible.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => scrollTo(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  active === i
                    ? "border-ink ring-2 ring-ink/10"
                    : "border-[color:var(--color-line)] hover:border-ink/25"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="64px"
                  onError={() => markFailed(src)}
                />
              </button>
            ))}
          </div>
          <div
            className="mt-3 flex justify-center gap-1.5"
            aria-hidden
          >
            {visible.map((_, i) => (
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
    </div>
  );
}
