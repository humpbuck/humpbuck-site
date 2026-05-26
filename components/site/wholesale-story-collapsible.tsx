"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

export function WholesaleStoryCollapsible({
  teaser,
  teaserLead,
  expandLabel,
  collapseLabel,
  children,
}: {
  teaser: string;
  teaserLead: string;
  expandLabel: string;
  collapseLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-line bg-white/70 shadow-card">
      {!open ? (
        <div className="p-6 sm:p-7 lg:p-8">
          <h3 className="font-serif text-xl text-ink sm:text-2xl">{teaser}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{teaserLead}…</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-controls="wholesale-story-panel"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/85 shadow-sm transition hover:border-ink/20 hover:bg-white hover:text-ink"
          >
            <span>{expandLabel}</span>
          </button>
        </div>
      ) : (
        <div id="wholesale-story-panel">
          <div className="flex justify-end border-b border-line px-6 pt-5 sm:px-7 lg:px-8">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-expanded
              aria-controls="wholesale-story-panel"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:text-ink"
            >
              {collapseLabel}
              <ChevronDown size={14} className="rotate-180" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="flex flex-col gap-5 p-6 sm:p-7 lg:p-8 pt-5">{children}</div>
        </div>
      )}
    </div>
  );
}
