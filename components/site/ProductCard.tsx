"use client";

import { type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/cart-context";
import { ProductCardHoverImages } from "@/components/site/product-card-hover-images";
import { ProductCardVariantSwatches } from "@/components/site/product-card-variant-swatches";
import { DisplayPrice } from "@/components/site/DisplayPrice";
import { type Product } from "@/lib/catalog";
import { CART_ADDED_EVENT } from "@/lib/cart-events";
import {
  canQuickAddProduct,
  variantForQuickAdd,
} from "@/lib/product-quick-add";
import { useProductCardImages } from "@/components/site/use-product-card-images";

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
  const { addItem, openCartDrawer } = useCart();
  const {
    variants,
    variantIndex,
    onVariantIndexChange,
    primarySrc,
    hoverSrc,
  } = useProductCardImages(product, cardImageUrl, cardHoverImageUrl);
  const variant = variantForQuickAdd(product, variantIndex);
  const addEnabled = canQuickAddProduct(product, variantIndex);

  function handleAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!addEnabled) return;

    addItem({
      slug: product.slug,
      qty: 1,
      productName: product.name,
      unitPrice: product.price,
      ...(variant
        ? {
            variantId: variant.id,
            variantLabel: variant.label,
            variantImage: variant.image,
          }
        : {}),
    });

    window.dispatchEvent(new CustomEvent(CART_ADDED_EVENT));
    openCartDrawer();
  }

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
          primarySrc={primarySrc}
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
            onSelectedIndexChange={onVariantIndexChange}
          />
        ) : null}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <DisplayPrice
              usd={product.price}
              className="text-base font-semibold"
            />
            {product.compareAtPrice != null && (
              <DisplayPrice
                usd={product.compareAtPrice}
                className="text-[12px] line-through"
                referenceClassName="hidden"
                primaryClassName="text-muted tabular-nums"
              />
            )}
          </div>
          <button
            type="button"
            disabled={!addEnabled}
            onClick={handleAdd}
            className="shrink-0 rounded-full border border-ink/15 bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:text-[11px]"
          >
            {t("cardAdd")}
          </button>
        </div>
      </div>
    </article>
  );
}
