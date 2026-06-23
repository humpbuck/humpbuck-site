"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCardHoverImages } from "@/components/site/product-card-hover-images";
import { ProductCardVariantSwatches } from "@/components/site/product-card-variant-swatches";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({
  product,
  imagePriority = false,
  imageEager = false,
  optimizeR2Image = false,
  imageQuality = 60,
  /** When set (e.g. R2-resolved), overrides `product.image` for cards. */
  cardImageUrl,
  /** Gallery hover image; when set, shown on pointer hover. */
  cardHoverImageUrl,
}: {
  product: Product;
  /** First viewport row(s) of grids — LCP + avoid lazy for above-the-fold. */
  imagePriority?: boolean;
  /** Eager load when preloaded below the hero — avoids lazy wait on scroll. */
  imageEager?: boolean;
  /**
   * Keep false by default because some R2 WebP objects can intermittently fail through
   * `/_next/image` in certain flows; allow selective opt-in for performance testing pages.
   */
  optimizeR2Image?: boolean;
  imageQuality?: number;
  cardImageUrl?: string;
  cardHoverImageUrl?: string;
}) {
  const t = useTranslations("Product");
  const [variantIndex, setVariantIndex] = useState(0);
  const variants = product.variantOptions ?? [];
  const baseImage = cardImageUrl?.trim() || product.image;
  const activeImage =
    variants.length > 0
      ? variants[variantIndex]?.image?.trim() || baseImage
      : baseImage;
  const hoverSrc = cardHoverImageUrl;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white/60 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <Link
        href={`/product/${product.slug}`}
        className="group relative aspect-square overflow-hidden bg-paper"
      >
        <div className="absolute left-3 top-3 z-10 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-paper">
          {t("sale")}
        </div>
        <ProductCardHoverImages
          primarySrc={activeImage}
          hoverSrc={hoverSrc}
          alt={product.name}
          imagePriority={imagePriority}
          imageEager={imageEager}
          optimizeR2={optimizeR2Image}
          imageQuality={imageQuality}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/product/${product.slug}`}
          className="font-serif text-base leading-snug text-ink transition hover:text-ink/80"
        >
          {product.name}
        </Link>
        {variants.length > 0 ? (
          <ProductCardVariantSwatches
            options={variants}
            productName={product.name}
            selectedIndex={variantIndex}
            onSelectedIndexChange={setVariantIndex}
          />
        ) : null}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-base font-semibold tabular-nums">
              {formatPrice(product.price)}
            </div>
            {product.compareAtPrice != null && (
              <div className="text-[12px] text-muted line-through tabular-nums">
                {formatPrice(product.compareAtPrice)}
              </div>
            )}
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70 underline-offset-4 hover:underline"
          >
            {t("view")}
          </Link>
        </div>
      </div>
    </article>
  );
}
