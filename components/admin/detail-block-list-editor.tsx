"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  emptyProductDetailBlock,
  PRODUCT_DETAIL_BLOCK_LAYOUT_LABELS,
  PRODUCT_DETAIL_BLOCK_LAYOUTS,
  type ProductDetailBlock,
} from "@/lib/product-detail-blocks";

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
      />
    </label>
  );
}

function blockSummaryLabel(block: ProductDetailBlock, index: number): string {
  const title = block.title.trim();
  if (title) return title;
  const image = block.image.trim();
  if (image) {
    const file = image.split("/").pop() ?? "Image set";
    return file.length > 36 ? `${file.slice(0, 33)}…` : file;
  }
  return "Empty block";
}

export function DetailBlockListEditor({
  values,
  onChange,
  onUpload,
}: {
  values: ProductDetailBlock[];
  onChange: (values: ProductDetailBlock[]) => void;
  onUpload: (file: File, blockIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]));
  const prevLengthRef = useRef(values.length);

  useEffect(() => {
    if (values.length > prevLengthRef.current) {
      setExpanded((prev) => new Set([...prev, values.length - 1]));
    }
    prevLengthRef.current = values.length;
  }, [values.length]);

  function updateBlock(index: number, patch: Partial<ProductDetailBlock>) {
    onChange(
      values.map((block, i) =>
        i === index ? { ...block, ...patch, stacked: patch.stacked ?? false } : block,
      ),
    );
  }

  function toggleBlock(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function removeBlock(index: number) {
    onChange(values.filter((_, i) => i !== index));
    setExpanded((prev) => {
      const next = new Set<number>();
      for (const i of prev) {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      }
      return next;
    });
  }

  function addBlock() {
    onChange([...values, emptyProductDetailBlock()]);
  }

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Closer look blocks
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Each block can use left image · right text or left text · right image on the product
            page.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {values.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setExpanded(new Set(values.map((_, i) => i)))}
                className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() => setExpanded(new Set())}
                className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
              >
                Collapse all
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={addBlock}
            className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
          >
            Add block
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {values.map((block, index) => {
          const isOpen = expanded.has(index);
          const summary = blockSummaryLabel(block, index);
          return (
            <div
              key={`detail-block-${index}`}
              className="overflow-hidden rounded-lg border border-line/70 bg-white/50"
            >
              <div className="flex items-center gap-2 border-b border-line/60 bg-paper/40 px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleBlock(index)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={isOpen}
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
                    strokeWidth={2}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Block {index + 1}
                  </span>
                  <span className="truncate text-sm text-ink/80">{summary}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="shrink-0 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              {isOpen ? (
                <div className="space-y-3 p-3">
                  <LabeledInput
                    label="Image URL"
                    value={block.image}
                    onChange={(image) => updateBlock(index, { image })}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white">
                      Upload WEBP
                      <input
                        type="file"
                        accept="image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            onUpload(file, index);
                            event.currentTarget.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  <LabeledInput
                    label="Heading"
                    value={block.title}
                    onChange={(title) => updateBlock(index, { title })}
                  />

                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Body
                    </span>
                    <textarea
                      value={block.body}
                      onChange={(event) => updateBlock(index, { body: event.target.value })}
                      rows={3}
                      className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Layout
                    </span>
                    <select
                      value={block.layout}
                      onChange={(event) =>
                        updateBlock(index, {
                          layout: event.target.value as ProductDetailBlock["layout"],
                          stacked: false,
                        })
                      }
                      className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
                    >
                      {PRODUCT_DETAIL_BLOCK_LAYOUTS.map((layout) => (
                        <option key={layout} value={layout}>
                          {PRODUCT_DETAIL_BLOCK_LAYOUT_LABELS[layout]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}

        {values.length === 0 ? (
          <p className="text-xs text-muted">No closer look blocks yet.</p>
        ) : null}
      </div>
    </div>
  );
}
