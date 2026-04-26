"use client";

import { useEffect, useMemo, useState } from "react";

type GuideItem = {
  title: string;
  body: string;
};

const GUIDE_ITEMS: GuideItem[] = [
  {
    title: "How to build your affiliate link",
    body:
      "Use the Link generator section below. Paste any product or page URL and it will append your PID automatically. Share that URL to track visits and orders under your account.",
  },
  {
    title: "Where to find your Coupon Code",
    body:
      "Your dedicated coupon code is created and managed by admin. If no code is shown yet, contact admin to bind one to your affiliate profile. Coupon-attributed orders also count for your commission.",
  },
  {
    title: "Where to find your Partner ID (PID)",
    body:
      "Your Partner ID is shown in Current status as PID. This ID is used in your trackable links (?pid=...). Keep it consistent when sharing links across channels.",
  },
  {
    title: "Commission payout cycle",
    body:
      "Commissions move from pending to eligible after delivery and hold period. Admin then marks payouts as paid in settlement ledger. You can track these statuses in your Attributed orders section.",
  },
  {
    title: "Payout details are required",
    body:
      "Please fill payout details (PayPal, bank account, or other) plus contact methods. If you cannot provide a payout account yet, keep your email or WhatsApp updated so admin can contact you for manual settlement.",
  },
];

export function AffiliateQuickGuide() {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(true);
  const item = GUIDE_ITEMS[idx];
  const canPrev = idx > 0;
  const canNext = idx < GUIDE_ITEMS.length - 1;
  const progress = useMemo(() => `${idx + 1}/${GUIDE_ITEMS.length}`, [idx]);

  useEffect(() => {
    const hidden = window.localStorage.getItem("affiliate_quick_guide_hidden_v1");
    if (hidden === "1") setOpen(false);
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
        Show affiliate guide
      </button>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white/60 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        Affiliate quick guide
        </p>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem("affiliate_quick_guide_hidden_v1", "1");
            setOpen(false);
          }}
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          Close
        </button>
      </div>
      <p className="mt-2 text-sm text-ink font-medium">{item.title}</p>
      <p className="mt-2 text-sm text-muted">{item.body}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {GUIDE_ITEMS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to guide ${i + 1}`}
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
          Prev
        </button>
        <button
          type="button"
          onClick={() => setIdx((v) => Math.min(GUIDE_ITEMS.length - 1, v + 1))}
          disabled={!canNext}
          className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
}
