import { R2 } from "@/lib/r2";

/**
 * Deep-space hero loop for DIGI-TEMP.
 * Default: R2 `home/digitemp-space.mp4`.
 * Override: `NEXT_PUBLIC_DIGI_HERO_VIDEO` = public path or full https URL.
 */
const envSrc = process.env.NEXT_PUBLIC_DIGI_HERO_VIDEO?.trim();

export const DIGI_HERO_VIDEO_SOURCES: readonly string[] = [
  ...(envSrc ? [envSrc] : []),
  R2.home.digitempSpaceMp4,
];
