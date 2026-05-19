"use client";

import { StorefrontImage } from "@/components/site/storefront-image";

export function ProductDetailImageStrip({
  productName,
  imageUrls,
}: {
  productName: string;
  imageUrls: string[];
}) {
  if (imageUrls.length === 0) return null;

  return (
    <div className="mt-10 flex flex-col gap-6">
      {imageUrls.map((src, i) => (
        <div
          key={`${i}-${src}`}
          className="relative overflow-hidden rounded-2xl border border-line bg-paper shadow-sm"
        >
          <StorefrontImage
            src={src}
            alt={`${productName} — detail ${i + 1}`}
            width={1200}
            height={1600}
            className="h-auto w-full object-cover"
            sizes="(max-width:1024px) 100vw, 896px"
          />
        </div>
      ))}
    </div>
  );
}
