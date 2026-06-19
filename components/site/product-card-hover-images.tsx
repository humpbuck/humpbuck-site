"use client";

import { StorefrontImage } from "@/components/site/storefront-image";

export function ProductCardHoverImages({
  primarySrc,
  hoverSrc,
  alt,
  imagePriority = false,
  imageEager = false,
  optimizeR2 = false,
  imageQuality = 60,
  sizes = "(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw",
}: {
  primarySrc: string;
  hoverSrc?: string | null;
  alt: string;
  imagePriority?: boolean;
  imageEager?: boolean;
  optimizeR2?: boolean;
  imageQuality?: number;
  sizes?: string;
}) {
  const primary = primarySrc.trim();
  const hover = hoverSrc?.trim();
  const hasHover = Boolean(hover && normalizeImageKey(hover) !== normalizeImageKey(primary));

  return (
    <>
      <StorefrontImage
        src={primary}
        alt={alt}
        fill
        priority={imagePriority}
        loading={imagePriority || imageEager ? "eager" : undefined}
        fetchPriority={imagePriority ? "high" : imageEager ? "low" : undefined}
        sizes={sizes}
        quality={imageQuality}
        optimizeR2={optimizeR2}
        className={`object-cover object-center transition duration-500 ${
          hasHover
            ? "opacity-100 group-hover:opacity-0 group-hover:scale-[1.03]"
            : "group-hover:scale-[1.03]"
        }`}
      />
      {hasHover ? (
        <StorefrontImage
          src={hover!}
          alt=""
          fill
          aria-hidden
          loading={imagePriority || imageEager ? "eager" : "lazy"}
          fetchPriority={imageEager ? "low" : undefined}
          sizes={sizes}
          quality={imageQuality}
          optimizeR2={optimizeR2}
          className="object-cover object-center opacity-0 transition duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
        />
      ) : null}
    </>
  );
}

function normalizeImageKey(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, "https://placeholder.local");
    return parsed.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}
