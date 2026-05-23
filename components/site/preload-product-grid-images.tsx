import { preload } from "react-dom";

export const PRODUCT_GRID_PRELOAD_COUNT = 4;

/** Warm first grid row(s) on shop / series / homepage product grids. */
export function PreloadProductGridImages({ urls }: { urls: string[] }) {
  for (const raw of urls.slice(0, PRODUCT_GRID_PRELOAD_COUNT)) {
    const url = raw.trim();
    if (!url) continue;
    preload(url, { as: "image", fetchPriority: "low" });
  }
  return null;
}
