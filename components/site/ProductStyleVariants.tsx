"use client";

import { StorefrontImage } from "@/components/site/storefront-image";
import { SubtleHorizontalScroll } from "@/components/site/subtle-horizontal-scroll";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isVariantOptionSellable, type ProductVariantOption } from "@/lib/catalog";

type VariantRowItem = {
  opt: ProductVariantOption;
  index: number;
};

function VariantThumbRow({
  items,
  productName,
  selected,
  imageErrorId,
  onSelect,
  onImageError,
  scrollLabel,
}: {
  items: VariantRowItem[];
  productName: string;
  selected: number;
  imageErrorId: Record<string, true>;
  onSelect: (index: number) => void;
  onImageError: (id: string) => void;
  scrollLabel: string;
}) {
  const t = useTranslations("Product");
  if (items.length === 0) return null;

  return (
    <SubtleHorizontalScroll
      className="w-full min-w-0"
      scrollLabel={scrollLabel}
      dragToScroll
      scrollerClassName="gap-2 [container-type:inline-size]"
      scrollerProps={{
        role: "group",
        "aria-label": t("style"),
      }}
    >
      {items.map(({ opt, index }) => {
        const unavailable = !isVariantOptionSellable(opt);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(index)}
            className={`relative aspect-square w-[var(--variant-col)] shrink-0 overflow-hidden rounded-xl border-2 transition [--variant-col:calc((100cqw-1.5rem)/3.5)] sm:[--variant-col:calc((100cqw-2rem)/4.5)] ${
              selected === index
                ? "border-ink ring-2 ring-inset ring-ink/10"
                : "border-line hover:border-ink/30"
            } ${unavailable ? "opacity-45" : ""}`}
            aria-pressed={selected === index}
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
                className="pointer-events-none object-cover object-center"
                sizes="(max-width:640px) 26vw, 110px"
                onError={() => onImageError(opt.id)}
              />
            )}
          </button>
        );
      })}
    </SubtleHorizontalScroll>
  );
}

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
  const splitAt = Math.ceil(options.length / 2);
  const row1: VariantRowItem[] = options
    .slice(0, splitAt)
    .map((opt, index) => ({ opt, index }));
  const row2: VariantRowItem[] = options
    .slice(splitAt)
    .map((opt, i) => ({ opt, index: splitAt + i }));
  const scrollLabel = t("variantsScrollAria", { product: productName });

  return (
    <div className="mt-8 w-full min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("style")}
      </div>
      <p className="mt-1 text-sm font-medium text-ink/90">
        {selectedOpt?.label}
      </p>
      {/*
        Two independent rows (phone + desktop). Each row scrolls sideways with
        its own rail, peeks half a thumb, and supports mouse drag.
      */}
      <div className="mt-4 flex w-full min-w-0 flex-col gap-3">
        <VariantThumbRow
          items={row1}
          productName={productName}
          selected={selected}
          imageErrorId={imageErrorId}
          onSelect={setSelected}
          onImageError={(id) =>
            setImageErrorId((m) => ({ ...m, [id]: true }))
          }
          scrollLabel={scrollLabel}
        />
        <VariantThumbRow
          items={row2}
          productName={productName}
          selected={selected}
          imageErrorId={imageErrorId}
          onSelect={setSelected}
          onImageError={(id) =>
            setImageErrorId((m) => ({ ...m, [id]: true }))
          }
          scrollLabel={scrollLabel}
        />
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
