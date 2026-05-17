"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const GUIDE_COUNT = 6;

export function AffiliateQuickGuide() {
  const t = useTranslations("AccountAffiliate");
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(true);
  const items = useMemo(
    () =>
      Array.from({ length: GUIDE_COUNT }, (_, i) => {
        const n = i + 1;
        return {
          title: t(`guide.item${n}Title` as "guide.item1Title"),
          body: t(`guide.item${n}Body` as "guide.item1Body"),
        };
      }),
    [t],
  );
  const item = items[idx] ?? items[0];
  const canPrev = idx > 0;
  const canNext = idx < GUIDE_COUNT - 1;
  const progress = useMemo(() => `${idx + 1}/${GUIDE_COUNT}`, [idx]);

  useEffect(() => {
    const hidden = window.localStorage.getItem("affiliate_quick_guide_hidden_v1");
    if (hidden === "1") queueMicrotask(() => setOpen(false));
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          window.localStorage.removeItem("affiliate_quick_guide_hidden_v1");
          setOpen(true);
        }}
        className="mt-4 inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
      >
        {t("guide.show")}
      </button>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          {t("guide.kicker")}
        </p>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem("affiliate_quick_guide_hidden_v1", "1");
            setOpen(false);
          }}
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          {t("guide.close")}
        </button>
      </div>
      <p className="mt-2 text-sm font-medium text-ink">{item.title}</p>
      <p className="mt-2 text-sm text-muted">{item.body}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("guide.dotAria", { n: i + 1 })}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === idx ? "bg-ink" : "bg-ink/20 hover:bg-ink/35"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted">{progress}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIdx((v) => Math.max(0, v - 1))}
          disabled={!canPrev}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition enabled:hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("guide.prev")}
        </button>
        <button
          type="button"
          onClick={() => setIdx((v) => Math.min(GUIDE_COUNT - 1, v + 1))}
          disabled={!canNext}
          className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("guide.next")}
        </button>
      </div>
    </section>
  );
}
