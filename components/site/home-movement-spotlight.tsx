"use client";

import { ArrowRight } from "lucide-react";
import { useSpotlightCardImages } from "@/components/site/use-product-card-images";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { ProductCardVariantSwatches } from "@/components/site/product-card-variant-swatches";
import type { ProductVariantOption } from "@/lib/catalog";

export function HomeMovementSpotlight({
  productHref,
  productName,
  imageAlt,
  baseImage,
  kicker,
  title,
  cta,
  variantOptions,
}: {
  productHref: string;
  productName: string;
  imageAlt: string;
  baseImage: string;
  kicker: string;
  title: string;
  cta: string;
  variantOptions: ProductVariantOption[];
}) {
  const { variantIndex, onVariantIndexChange, primarySrc: activeImage, variants } =
    useSpotlightCardImages(baseImage, undefined, variantOptions);

  const swatches =
    variants.length > 0 ? (
      <ProductCardVariantSwatches
        options={variants}
        productName={productName}
        selectedIndex={variantIndex}
        onSelectedIndexChange={onVariantIndexChange}
      />
    ) : null;

  return (
    <div className="mx-auto flex w-full flex-row items-center justify-center gap-3 sm:gap-8 md:gap-14 lg:gap-20">
      <div className="flex w-[clamp(4.5rem,20vw,20rem)] shrink-0 flex-col items-center">
        <Link
          href={productHref}
          className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line/70 bg-[#080808] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-line hover:shadow-md"
        >
          <StorefrontImage
            src={activeImage}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 20vw, 320px"
            className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
          />
        </Link>
      </div>

      <div className="flex min-w-0 max-w-xs flex-col items-start text-left">
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted/90 sm:text-[10px] sm:tracking-[0.2em]">
          {kicker}
        </p>
        <h2 className="mt-1 font-serif text-sm leading-snug tracking-tight sm:mt-2 sm:text-2xl lg:text-[1.75rem]">
          {title}
        </h2>
        <Link
          href={productHref}
          className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/75 underline-offset-8 transition hover:text-ink hover:underline sm:mt-4 sm:gap-2 sm:text-[11px] sm:tracking-[0.14em]"
        >
          {cta}
          <ArrowRight className="h-3 w-3 sm:h-[15px] sm:w-[15px]" strokeWidth={2} aria-hidden />
        </Link>
        {swatches ? <div className="mt-2 sm:mt-3">{swatches}</div> : null}
      </div>
    </div>
  );
}
