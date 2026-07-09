"use client";

import { useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";

export function HomeCouponPrompt({
  kicker,
  title,
  question,
  inputPlaceholder,
  confirmLabel,
  taglineLine1,
  taglineLine2,
  couponCode,
  couponRewardLabel,
  couponNoCodeMessage,
  closeLabel,
}: {
  kicker: string;
  title: string;
  question: string;
  inputPlaceholder: string;
  confirmLabel: string;
  taglineLine1: string;
  taglineLine2: string;
  couponCode: string | null;
  couponRewardLabel: string;
  couponNoCodeMessage: string;
  closeLabel: string;
}) {
  const [answer, setAnswer] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="relative z-20 mx-auto w-full max-w-3xl rounded-3xl border border-line/80 bg-white/80 px-4 py-10 shadow-[0_1px_0_rgba(15,17,20,0.04)] backdrop-blur-sm max-sm:px-3 sm:px-10 sm:py-12 md:px-12 md:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
            {kicker}
          </p>
          <h2 className="mt-3 font-serif text-[clamp(1.75rem,3vw+0.5rem,2.5rem)] leading-tight tracking-tight text-ink">
            {title}
          </h2>
          <div
            className="mx-auto mt-5 h-px w-14 bg-linear-to-r from-transparent via-line to-transparent"
            aria-hidden
          />
        </div>

        <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
          <p className="text-center font-serif leading-tight tracking-[-0.01em] text-ink/88 max-sm:whitespace-nowrap max-sm:text-[clamp(0.625rem,2.85vw+0.2rem,1rem)] sm:text-xl sm:leading-relaxed sm:tracking-normal sm:whitespace-normal">
            {question}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-stretch sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:bg-white sm:shadow-sm">
            <input
              type="text"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={inputPlaceholder}
              className="relative z-10 w-full scroll-mb-24 rounded-2xl border border-line bg-white px-5 py-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink/20 focus:ring-2 focus:ring-ink/8 sm:rounded-none sm:border-0 sm:border-r sm:border-line sm:py-4 sm:text-[15px] sm:focus:ring-0"
              aria-label={question}
            />
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-ink px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-paper transition hover:bg-ink/90 sm:rounded-none sm:px-10 sm:py-4"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <CenterModal
          title=""
          accessibleTitle={`${taglineLine1} ${taglineLine2}`}
          onClose={() => setModalOpen(false)}
        >
          <div className="px-1 pb-1 pt-1 text-center sm:px-2">
            <div className="font-serif text-[clamp(1.125rem,2.5vw+0.75rem,1.5rem)] leading-relaxed text-ink">
              <p>{taglineLine1}</p>
              {taglineLine2 ? <p className="mt-1">{taglineLine2}</p> : null}
            </div>

            {couponCode ? (
              <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
                <p className="font-serif text-lg leading-snug text-ink sm:text-xl">
                  {couponRewardLabel}{" "}
                  <span className="font-mono text-[1.05em] font-semibold tracking-[0.08em] text-ink">
                    {couponCode}
                  </span>
                </p>
              </div>
            ) : (
              <p className="mx-auto mt-7 max-w-sm text-sm leading-relaxed text-muted">
                {couponNoCodeMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-8 inline-flex min-w-[9rem] items-center justify-center rounded-full bg-ink px-8 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
            >
              {closeLabel}
            </button>
          </div>
        </CenterModal>
      ) : null}
    </>
  );
}
