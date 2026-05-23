import { preload } from "react-dom";
import { R2 } from "@/lib/r2";

/** Warm R2 series hero WebPs while the DIGI-TEMP hero is visible (low priority, no LCP impact). */
export function PreloadHomeSeriesImages() {
  preload(R2.home.rmTonneauSeriesBackgroundWebp, {
    as: "image",
    fetchPriority: "low",
  });
  preload(R2.home.rdAstralSeriesBackgroundWebp, {
    as: "image",
    fetchPriority: "low",
  });
  return null;
}
