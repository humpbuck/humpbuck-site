"use client";

import { useState } from "react";
import { StorefrontImage } from "@/components/site/storefront-image";

type Props = {
  src: string;
  /** Two-letter (or so) fallback when the URL fails. */
  fallbackLabel: string;
  alt: string;
  sizes: string;
  className: string;
};

/**
 * Order history thumbs: R2 + `next/image` optimizer sometimes fails; load
 * unoptimized and show a monogram if the file 404s or is blocked.
 */
export function OrderLineProductImage({
  src,
  fallbackLabel,
  alt,
  sizes,
  className,
}: Props) {
  const [bad, setBad] = useState(false);
  const monogram = fallbackLabel
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "—";

  if (bad) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-zinc-200 text-center text-[9px] font-bold leading-tight text-zinc-500"
        aria-hidden
      >
        {monogram}
      </div>
    );
  }
  return (
    <StorefrontImage
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      onError={() => setBad(true)}
    />
  );
}
