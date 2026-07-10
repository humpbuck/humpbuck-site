"use client";

import { useMemo, useState } from "react";
import type { HomeFaqItem } from "@/lib/site-home-content";

const EMPTY_ITEM: HomeFaqItem = { question: "", answer: "" };

export function FaqItemsEditor({
  initialItems,
}: {
  initialItems: HomeFaqItem[];
}) {
  const [items, setItems] = useState<HomeFaqItem[]>(() =>
    initialItems.length > 0 ? initialItems : [{ ...EMPTY_ITEM }],
  );

  const faqItemsJson = useMemo(() => JSON.stringify(items), [items]);

  function updateItem(index: number, patch: Partial<HomeFaqItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [...current, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((current) => {
      if (current.length <= 1) return [{ ...EMPTY_ITEM }];
      return current.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="faqItemsJson" value={faqItemsJson} readOnly />

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:bg-white"
        >
          Add
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`faq-item-${index}`}
            className="rounded-2xl border border-line bg-white/60 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Question {index + 1}
              </span>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded-md border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Question {index + 1}
              </span>
              <input
                type="text"
                value={item.question}
                onChange={(event) =>
                  updateItem(index, { question: event.target.value })
                }
                placeholder="What currency are prices shown in?"
                className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Answer {index + 1}
              </span>
              <textarea
                rows={4}
                value={item.answer}
                onChange={(event) =>
                  updateItem(index, { answer: event.target.value })
                }
                placeholder="All prices are listed in US dollars…"
                className="mt-2 min-h-[6rem] w-full resize-y rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
