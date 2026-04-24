"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductVariantOption } from "@/lib/catalog";

export function ProductStyleVariants({
  options,
  productName,
  selectedIndex: controlledIndex,
  onSelectedIndexChange,
}: {
  options: ProductVariantOption[];
  productName: string;
  /** Controlled selection (both props required together). */
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
}) {
  const [internal, setInternal] = useState(0);
  const controlled =
    controlledIndex !== undefined && onSelectedIndexChange !== undefined;
  const selected = controlled ? controlledIndex! : internal;
  const [imageErrorById, setImageErrorById] = useState<Record<string, true>>(
    {},
  );

  function setSelected(i: number) {
    onSelectedIndexChange?.(i);
    if (!controlled) setInternal(i);
  }

  if (options.length === 0) return null;

  return (
    <div className="mt-8 w-full min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Style
      </div>
      <p className="mt-1 text-sm font-medium text-ink/90">
        {options[selected]?.label}
      </p>
      <div className="mt-4 grid w-full min-w-0 grid-cols-4 gap-2 sm:grid-cols-6">
        {options.map((opt, i) => {
          const unavailable = opt.inStock === false;
          return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelected(i)}
            className={`relative aspect-square min-w-0 overflow-hidden rounded-xl border-2 transition ${
              selected === i
                ? "border-ink ring-2 ring-inset ring-ink/10"
                : "border-[color:var(--color-line)] hover:border-ink/30"
            } ${unavailable ? "opacity-45" : ""}`}
            aria-pressed={selected === i}
            aria-label={
              unavailable
                ? `${opt.label} for ${productName} — out of stock`
                : `${opt.label} for ${productName}`
            }
          >
            {imageErrorById[opt.id] ? (
              <div className="absolute inset-0 flex items-center justify-center bg-paper px-1 text-center text-[9px] font-semibold uppercase leading-tight text-muted">
                {opt.label}
              </div>
            ) : (
              <Image
                src={opt.image}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width:640px) 22vw, 96px"
                onError={() =>
                  setImageErrorById((m) => ({ ...m, [opt.id]: true }))
                }
              />
            )}
          </button>
        );
        })}
      </div>
    </div>
  );
}
