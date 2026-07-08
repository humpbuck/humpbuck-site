"use client";

import { StorefrontImage } from "@/components/site/storefront-image";
import {
  blockUsesStackedLayout,
  detailBlockHasContent,
  type ProductDetailBlock,
} from "@/lib/product-detail-blocks";

function CloserLookBlockImage({
  productName,
  src,
  index,
}: {
  productName: string;
  src: string;
  index: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <StorefrontImage
        src={src}
        alt={`${productName} — detail ${index + 1}`}
        width={1200}
        height={1200}
        className="h-auto w-full object-cover"
        sizes="(max-width:1024px) 100vw, 560px"
      />
    </div>
  );
}

function CloserLookTextBlock({ block }: { block: ProductDetailBlock }) {
  return (
    <div className="max-w-3xl">
      {block.title.trim() ? (
        <h3 className="font-serif text-2xl tracking-tight text-ink">{block.title.trim()}</h3>
      ) : null}
      {block.body.trim() ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-[15px] sm:leading-[1.7]">
          {block.body.trim()}
        </p>
      ) : null}
    </div>
  );
}

function CloserLookSplitBlock({
  productName,
  block,
  index,
}: {
  productName: string;
  block: ProductDetailBlock;
  index: number;
}) {
  const imageLeft = block.layout === "image-left";
  const hasImage = Boolean(block.image.trim());
  const hasText = Boolean(block.title.trim() || block.body.trim());

  if (!hasImage && hasText) {
    return <CloserLookTextBlock block={block} />;
  }

  const imageCell = hasImage ? (
    <CloserLookBlockImage productName={productName} src={block.image} index={index} />
  ) : (
    <div className="hidden lg:block" aria-hidden />
  );

  const textCell = hasText ? (
    <div className="flex min-w-0 flex-col justify-center px-1 sm:px-2">
      {block.title.trim() ? (
        <h3 className="font-serif text-2xl tracking-tight text-ink">{block.title.trim()}</h3>
      ) : null}
      {block.body.trim() ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted sm:text-[15px] sm:leading-[1.7]">
          {block.body.trim()}
        </p>
      ) : null}
    </div>
  ) : (
    <div className="hidden lg:block" aria-hidden />
  );

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
      <div className={imageLeft ? "min-w-0 lg:order-1" : "min-w-0 lg:order-2"}>{imageCell}</div>
      <div className={imageLeft ? "min-w-0 lg:order-2" : "min-w-0 lg:order-1"}>{textCell}</div>
    </div>
  );
}

export function ProductCloserLookSection({
  productName,
  sectionTitle,
  sectionIntro,
  blocks,
}: {
  productName: string;
  sectionTitle: string;
  sectionIntro: string;
  blocks: ProductDetailBlock[];
}) {
  const visible = blocks.filter(detailBlockHasContent);
  if (visible.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-14">
      <h2 className="font-serif text-2xl tracking-tight">{sectionTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{sectionIntro}</p>
      <div className="mt-10 flex flex-col gap-12 lg:gap-16">
        {visible.map((block, index) => {
          const hasImage = Boolean(block.image.trim());
          const hasText = Boolean(block.title.trim() || block.body.trim());

          if (!hasImage && hasText) {
            return (
              <CloserLookTextBlock key={`${index}-${block.title}-${block.body}`} block={block} />
            );
          }

          if (hasImage && blockUsesStackedLayout(block)) {
            return (
              <CloserLookBlockImage
                key={`${index}-${block.image}`}
                productName={productName}
                src={block.image}
                index={index}
              />
            );
          }

          return (
            <CloserLookSplitBlock
              key={`${index}-${block.image}-${block.title}`}
              productName={productName}
              block={block}
              index={index}
            />
          );
        })}
      </div>
    </section>
  );
}
