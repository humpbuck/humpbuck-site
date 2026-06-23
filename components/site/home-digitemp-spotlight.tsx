"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { ProductCardVariantSwatches } from "@/components/site/product-card-variant-swatches";
import { ProductFiveStarRating } from "@/components/site/product-five-star-rating";
import { DisplayPrice } from "@/components/site/DisplayPrice";
import { type ProductVariantOption } from "@/lib/catalog";

export function HomeDigitempSpotlight({
  productHref,
  productName,
  baseImage,
  imageAlt,
  featuredLabel,
  viewProductLabel,
  heroBadge,
  heroLead,
  price,
  compareAtPrice,
  fiveStarCount,
  showRating,
  variantOptions,
}: {
  productHref: string;
  productName: string;
  baseImage: string;
  imageAlt: string;
  featuredLabel: string;
  viewProductLabel: string;
  heroBadge: string;
  heroLead: string;
  price: number;
  compareAtPrice?: number;
  fiveStarCount: number;
  showRating: boolean;
  variantOptions: ProductVariantOption[];
}) {
  const [variantIndex, setVariantIndex] = useState(0);
  const variants = variantOptions;
  const activeImage =
    variants.length > 0
      ? variants[variantIndex]?.image?.trim() || baseImage
      : baseImage;

  const swatches =
    variants.length > 0 ? (
      <ProductCardVariantSwatches
        options={variants}
        productName={productName}
        selectedIndex={variantIndex}
        onSelectedIndexChange={setVariantIndex}
      />
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-10 md:max-w-none md:flex-row md:items-center md:justify-center md:gap-12 lg:gap-16 xl:gap-20">
      <div className="relative mx-auto w-full max-w-sm min-w-0 shrink-0 md:mx-0 md:max-w-[340px] lg:max-w-[400px]">
        <Link
          href={productHref}
          className="group relative block aspect-square overflow-hidden rounded-[24px] border border-line/70 bg-white shadow-sm transition outline-offset-4 hover:-translate-y-0.5 hover:border-line hover:shadow-md focus-visible:outline-2 focus-visible:outline-ink/30 sm:rounded-[28px]"
        >
          <StorefrontImage
            src={activeImage}
            alt={imageAlt}
            fill
            priority
            fetchPriority="high"
            quality={68}
            className="object-contain object-center bg-white transition duration-700 group-hover:scale-[1.03]"
            sizes="(max-width:767px) 92vw, 400px"
          />
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-line/80 bg-paper/95 p-3.5 shadow-sm backdrop-blur-sm sm:bottom-5 sm:left-5 sm:right-5 sm:p-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  {featuredLabel}
                </div>
                <div className="mt-1 font-serif text-base text-ink sm:text-lg">{productName}</div>
                {showRating ? (
                  <ProductFiveStarRating count={fiveStarCount} compact className="mt-1" />
                ) : null}
              </div>
              <div className="text-right">
                <DisplayPrice
                  usd={price}
                  className="text-lg font-semibold text-ink sm:text-xl"
                  referenceClassName="text-[10px] text-muted"
                />
                {compareAtPrice != null && (
                  <DisplayPrice
                    usd={compareAtPrice}
                    hideReference
                    primaryClassName="text-[12px] text-muted line-through tabular-nums"
                  />
                )}
              </div>
            </div>
            <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-ink py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-paper transition group-hover:bg-ink/90 sm:mt-4 sm:py-2.5 sm:text-[11px]">
              {viewProductLabel}
            </span>
          </div>
        </Link>
        {swatches ? (
          <div className="mt-3 flex justify-center md:hidden">{swatches}</div>
        ) : null}
      </div>

      <div className="min-w-0 md:max-w-[20rem] md:flex-none lg:max-w-[24rem]">
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white/60 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.2em] text-muted sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[8px]">
          <Sparkles className="h-2.5 w-2.5 shrink-0 text-digital-dim sm:h-3 sm:w-3" strokeWidth={2} />
          {heroBadge}
        </div>
        <h2 className="mt-6 font-serif font-normal leading-[1.05] tracking-[-0.02em] text-ink md:mt-5">
          <span className="block w-full max-w-full min-w-0 whitespace-nowrap leading-[1.08] text-[clamp(1.45rem,min(5vw+0.45rem,2.2rem),2.2rem)] md:text-[clamp(1.85rem,2.2vw,2.35rem)] lg:text-[clamp(2rem,2vw,2.65rem)]">
            HUMPBUCK{" "}
            <span className="inline">DIGI{"\u2011"}TEMP</span>
          </span>
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:mt-5 md:max-w-none md:text-[17px] md:leading-[1.65] lg:mt-6 lg:text-lg lg:leading-relaxed">
          {heroLead}
        </p>
        {swatches ? <div className="hidden md:block">{swatches}</div> : null}
      </div>
    </div>
  );
}
