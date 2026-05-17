"use client";

import imageCompression from "browser-image-compression";

const WEBP = "image/webp";

export const REVIEW_IMAGE_MAX_EDGE = 1600;
/** Target size cap (the library iterates down toward this). */
export const REVIEW_IMAGE_MAX_SIZE_MB = 0.85;
export const REVIEW_IMAGE_WEBP_QUALITY = 0.82;

/**
 * Buyer review photos: resize, compress, and encode as **WebP** in the browser before upload to R2.
 * Runs a stricter second pass if the first output is not WebP (uncommon) or is still near the 2 MB upload cap.
 */
export async function compressReviewImageToWebP(file: File): Promise<Blob> {
  const base = {
    maxSizeMB: REVIEW_IMAGE_MAX_SIZE_MB,
    maxWidthOrHeight: REVIEW_IMAGE_MAX_EDGE,
    useWebWorker: true,
    fileType: WEBP,
    initialQuality: REVIEW_IMAGE_WEBP_QUALITY,
    maxIteration: 18,
  };

  const first = await imageCompression(file, base);
  const blob: Blob =
    first instanceof File ? first : new Blob([first], { type: WEBP });

  /* Presign allow max 2 MB in `app/api/reviews/presign/route.ts` */
  const overPresign = blob.size > 1.9 * 1024 * 1024;
  if (blob.type.includes("webp") && !overPresign) {
    return blob;
  }

  const stricter = await imageCompression(file, {
    ...base,
    maxSizeMB: 0.6,
    initialQuality: 0.7,
    maxIteration: 22,
  });
  const out = stricter instanceof File ? stricter : new Blob([stricter], { type: WEBP });
  return out.type.includes("webp")
    ? out
    : new Blob([out], { type: WEBP });
}
