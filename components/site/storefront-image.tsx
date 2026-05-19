import Image, { type ImageProps } from "next/image";
import { isR2PublicObjectUrl } from "@/lib/r2-public-image";

export type StorefrontImageProps = ImageProps & {
  /**
   * When true, R2 URLs may use `/_next/image` (default false — browser loads R2 directly).
   * Only for deliberate perf experiments; storefront should keep this false.
   */
  optimizeR2?: boolean;
};

/**
 * Storefront `next/image` wrapper: public R2 objects skip the optimizer (`unoptimized`)
 * so mobile browsers fetch the CDN URL directly (avoids intermittent `/_next/image` 5xx on WebP).
 */
export function StorefrontImage({
  src,
  unoptimized,
  optimizeR2 = false,
  ...props
}: StorefrontImageProps) {
  const srcString = typeof src === "string" ? src.trim() : "";
  const directR2 =
    !optimizeR2 && srcString.length > 0 && isR2PublicObjectUrl(srcString);

  return (
    <Image
      src={src}
      unoptimized={Boolean(unoptimized) || directR2}
      {...props}
    />
  );
}
