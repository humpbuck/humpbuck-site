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
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5 md:max-w-none md:flex-row md:justify-center md:gap-14 lg:gap-20">
      <div className="flex w-full max-w-[240px] shrink-0 flex-col items-center md:mx-0 md:max-w-[280px] lg:max-w-[320px]">
        <Link
          href={productHref}
          className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line/70 bg-[#080808] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-line hover:shadow-md"
        >
          <StorefrontImage
            src={activeImage}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width:768px) 240px, 320px"
            className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
          />
        </Link>
        {swatches ? (
          <div className="mt-3 flex justify-center md:hidden">{swatches}</div>
        ) : null}
      </div>

      <div className="flex w-full flex-col items-center rounded-2xl border border-white/15 bg-transparent px-5 py-4 text-center [text-shadow:0_1px_16px_rgb(0_0_0/0.5)] backdrop-blur-md sm:px-6 sm:py-5 md:min-w-0 md:max-w-xs md:flex-none md:items-start md:text-left">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/85 md:text-[10px] md:tracking-[0.2em]">
          {kicker}
        </p>
        <h2 className="mt-1.5 font-serif text-lg leading-snug tracking-tight text-white md:mt-2 md:text-2xl lg:text-[1.75rem]">
          {title}
        </h2>
        <Link
          href={productHref}
          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/92 underline-offset-8 transition hover:text-white hover:underline md:mt-4 md:gap-2 md:text-[11px] md:tracking-[0.14em]"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" strokeWidth={2} aria-hidden />
        </Link>
        {swatches ? <div className="hidden md:block">{swatches}</div> : null}
      </div>
    </div>
  );
}
