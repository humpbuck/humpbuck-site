"use client";

import { StorefrontImage } from "@/components/site/storefront-image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isVariantOptionSellable, type ProductVariantOption } from "@/lib/catalog";

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
  const t = useTranslations("Product");
  const [internal, setInternal] = useState(0);
  const controlled =
    controlledIndex !== undefined && onSelectedIndexChange !== undefined;
  const selected = controlled ? controlledIndex! : internal;
  const [imageErrorId, setImageErrorId] = useState<Record<string, true>>({});

  function setSelected(i: number) {
    onSelectedIndexChange?.(i);
    if (!controlled) setInternal(i);
  }

  if (options.length === 0) return null;

  const selectedOpt = options[selected];
  const previewBroken = selectedOpt ? Boolean(imageErrorId[selectedOpt.id]) : true;

  return (
    <div className="mt-8 w-full min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("style")}
      </div>
      <p className="mt-1 text-sm font-medium text-ink/90">
        {selectedOpt?.label}
      </p>
      <div className="mt-4 grid w-full min-w-0 grid-cols-4 gap-2 sm:grid-cols-6">
        {options.map((opt, i) => {
          const unavailable = !isVariantOptionSellable(opt);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative aspect-square min-w-0 overflow-hidden rounded-xl border-2 transition ${
                selected === i
                  ? "border-ink ring-2 ring-inset ring-ink/10"
                  : "border-line hover:border-ink/30"
              } ${unavailable ? "opacity-45" : ""}`}
              aria-pressed={selected === i}
              aria-label={
                unavailable
                  ? t("variantOutAria", { label: opt.label, product: productName })
                  : t("variantAria", { label: opt.label, product: productName })
              }
            >
              {imageErrorId[opt.id] ? (
                <div className="absolute inset-0 flex items-center justify-center bg-paper px-1 text-center text-[9px] font-semibold uppercase leading-tight text-muted">
                  {opt.label}
                </div>
              ) : (
                <StorefrontImage
                  src={opt.image}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:640px) 22vw, 96px"
                  onError={() =>
                    setImageErrorId((m) => ({ ...m, [opt.id]: true }))
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/*
        Mobile/tablet only: selected-variant preview under the thumb grid
        (above Add to bag) so buyers see the style without scrolling to gallery.
        Desktop keeps the side-by-side gallery, so this stays lg:hidden.
      */}
      {selectedOpt && (
        <div
          className="relative mx-auto mt-5 aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-paper lg:hidden"
          aria-live="polite"
        >
          {previewBroken ? (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-medium text-muted">
              {selectedOpt.label}
            </div>
          ) : (
            <StorefrontImage
              key={selectedOpt.id}
              src={selectedOpt.image}
              alt={t("variantAria", {
                label: selectedOpt.label,
                product: productName,
              })}
              fill
              className="object-cover object-center"
              sizes="320px"
              onError={() =>
                setImageErrorId((m) => ({ ...m, [selectedOpt.id]: true }))
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
