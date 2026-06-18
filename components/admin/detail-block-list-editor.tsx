"use client";

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

export function DetailBlockListEditor({
  values,
  onChange,
  onUpload,
}: {
  values: ProductDetailBlock[];
  onChange: (values: ProductDetailBlock[]) => void;
  onUpload: (file: File, blockIndex: number) => void;
}) {
  function updateBlock(index: number, patch: Partial<ProductDetailBlock>) {
    onChange(
      values.map((block, i) =>
        i === index ? { ...block, ...patch, stacked: patch.stacked ?? false } : block,
      ),
    );
  }

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Closer look blocks
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Each block can use left image · right text or left text · right image on the product
            page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...values, emptyProductDetailBlock()])}
          className="shrink-0 rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
        >
          Add block
        </button>
      </div>

      <div className="space-y-4">
        {values.map((block, index) => (
          <div
            key={`detail-block-${index}`}
            className="space-y-3 rounded-lg border border-line/70 bg-white/50 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Block {index + 1}
              </p>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>

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
        ))}

        {values.length === 0 ? (
          <p className="text-xs text-muted">No closer look blocks yet.</p>
        ) : null}
      </div>
    </div>
  );
}
