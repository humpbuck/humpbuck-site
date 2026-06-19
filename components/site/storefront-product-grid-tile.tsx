"use client";

import { type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/cart-context";
import { ProductCardHoverImages } from "@/components/site/product-card-hover-images";
import {
  formatPrice,
  isVariantOptionSellable,
  type Product,
  type ProductVariantOption,
} from "@/lib/catalog";
import { CART_ADDED_EVENT } from "@/lib/cart-events";

function firstSellableVariant(product: Product): ProductVariantOption | null {
  const options = product.variantOptions ?? [];
  if (options.length === 0) return null;
  return options.find(isVariantOptionSellable) ?? null;
}

function canQuickAdd(product: Product): boolean {
  if (!product.inStock) return false;
  const options = product.variantOptions ?? [];
  if (options.length === 0) return true;
  return firstSellableVariant(product) != null;
}

export function StorefrontProductGridTile({
  product,
  cardImageUrl,
  cardHoverImageUrl,
  imagePriority = false,
  imageEager = false,
  cartSource = "home_grid",
}: {
  product: Product;
  cardImageUrl?: string;
  cardHoverImageUrl?: string;
  imagePriority?: boolean;
  imageEager?: boolean;
  cartSource?: string;
}) {
  const t = useTranslations("Home");
  const { addItem, openCartDrawer } = useCart();
  const imgSrc = cardImageUrl?.trim() || product.image;
  const variant = firstSellableVariant(product);
  const addEnabled = canQuickAdd(product);

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
    <article className="flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="group relative aspect-square overflow-hidden rounded-xl border border-line/80 bg-white/50 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <ProductCardHoverImages
          primarySrc={imgSrc}
          hoverSrc={cardHoverImageUrl}
          alt={product.name}
          imagePriority={imagePriority}
          imageEager={imageEager}
          sizes="(max-width:640px) 50vw, 25vw"
        />
      </Link>

      <Link
        href={`/product/${product.slug}`}
        className="mt-3 line-clamp-2 text-left font-serif text-sm leading-snug text-ink transition hover:text-ink/80 sm:text-[15px]"
      >
        {product.name}
      </Link>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="text-[13px] font-semibold tabular-nums text-ink sm:text-sm">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice != null && (
            <span className="text-[11px] text-muted line-through tabular-nums sm:text-xs">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={!addEnabled}
          onClick={handleAdd}
          className="shrink-0 rounded-full border border-ink/15 bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:text-[11px]"
        >
          {t("recommendedAdd")}
        </button>
      </div>
    </article>
  );
}

/** @deprecated Use `StorefrontProductGridTile`. */
export const RecommendedProductTile = StorefrontProductGridTile;
