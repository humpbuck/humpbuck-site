"use client";

import { useMemo, useState } from "react";
import type { SiteAnnouncementSlide } from "@/lib/site-announcement";

const EMPTY_SLIDE: SiteAnnouncementSlide = { message: "", href: "" };

export function AnnouncementSlidesEditor({
  initialSlides,
}: {
  initialSlides: SiteAnnouncementSlide[];
}) {
  const [slides, setSlides] = useState<SiteAnnouncementSlide[]>(() =>
    initialSlides.length > 0 ? initialSlides : [{ ...EMPTY_SLIDE }],
  );

  const slidesJson = useMemo(() => JSON.stringify(slides), [slides]);

  function updateSlide(index: number, patch: Partial<SiteAnnouncementSlide>) {
    setSlides((current) =>
      current.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    );
  }

  function addSlide() {
    setSlides((current) => [...current, { ...EMPTY_SLIDE }]);
  }

  function removeSlide(index: number) {
    setSlides((current) => {
      if (current.length <= 1) return [{ ...EMPTY_SLIDE }];
      return current.filter((_, i) => i !== index);
    });
  }

  function moveSlide(index: number, direction: -1 | 1) {
    setSlides((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item!);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="slidesJson" value={slidesJson} readOnly />

      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Announcement slides
        </span>
        <button
          type="button"
          onClick={addSlide}
          className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:bg-white"
        >
          Add slide
        </button>
      </div>

      <p className="text-xs text-muted">
        Multiple slides rotate automatically on the homepage bar, similar to a
        vertical ticker. One slide shows as static text.
      </p>

      <div className="space-y-3">
        {slides.map((slide, index) => (
          <div
            key={`slide-${index}`}
            className="rounded-2xl border border-line bg-white/60 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Slide {index + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveSlide(index, -1)}
                  disabled={index === 0}
                  className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60 disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(index, 1)}
                  disabled={index === slides.length - 1}
                  className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60 disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeSlide(index)}
                  className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60"
                >
                  Remove
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Message
              </span>
              <textarea
                rows={2}
                value={slide.message}
                onChange={(event) =>
                  updateSlide(index, { message: event.target.value })
                }
                placeholder="Free shipping on orders over $100"
                className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Optional link
              </span>
              <input
                type="text"
                value={slide.href}
                onChange={(event) =>
                  updateSlide(index, { href: event.target.value })
                }
                placeholder="/shop or https://..."
                className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
