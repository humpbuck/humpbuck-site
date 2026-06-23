"use client";

import { StorefrontImage } from "@/components/site/storefront-image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isVariantOptionSellable, type ProductVariantOption } from "@/lib/catalog";

/** Compact variant thumbnails for shop / home product cards. */
export function ProductCardVariantSwatches({
  options,
  productName,
  selectedIndex,
  onSelectedIndexChange,
}: {
  options: ProductVariantOption[];
  productName: string;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}) {
  const t = useTranslations("Product");
  const [imageErrorId, setImageErrorId] = useState<Record<string, true>>({});

  if (options.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((opt, i) => {
        const unavailable = !isVariantOptionSellable(opt);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectedIndexChange(i);
            }}
            className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-md border transition ${
              selectedIndex === i
                ? "border-ink ring-1 ring-inset ring-ink/15"
                : "border-line hover:border-ink/30"
            } ${unavailable ? "opacity-45" : ""}`}
            aria-pressed={selectedIndex === i}
            aria-label={
              unavailable
                ? t("variantOutAria", { label: opt.label, product: productName })
                : t("variantAria", { label: opt.label, product: productName })
            }
          >
            {imageErrorId[opt.id] ? (
              <span className="absolute inset-0 flex items-center justify-center bg-paper text-[8px] font-semibold uppercase text-muted">
                {opt.label.slice(0, 2)}
              </span>
            ) : (
              <StorefrontImage
                src={opt.image}
                alt=""
                fill
                className="object-cover object-center"
                sizes="28px"
                onError={() => setImageErrorId((m) => ({ ...m, [opt.id]: true }))}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
