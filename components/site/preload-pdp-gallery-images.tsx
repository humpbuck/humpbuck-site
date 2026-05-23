import { preload } from "react-dom";

/** Warm full PDP gallery while the document streams (all slides + thumbs). */
export function PreloadPdpGalleryImages({ urls }: { urls: string[] }) {
  for (const raw of urls) {
    const url = raw.trim();
    if (!url) continue;
    preload(url, { as: "image", fetchPriority: "low" });
  }
  return null;
}
