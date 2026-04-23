/**
 * Opens Google Maps search for Guangzhou — works without API keys.
 */
export const GUANGZHOU_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Guangzhou%2C+Guangdong+Province%2C+China" as const;

export type AboutMapEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "osm-fallback"; src: string };

/**
 * Google Maps embed (preferred), in order:
 * 1. `NEXT_PUBLIC_ABOUT_GOOGLE_MAP_EMBED_URL` — paste full iframe `src` from Google Maps → Share → **Embed a map**.
 * 2. `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` — Maps Embed API key, place query fixed to Guangzhou (enable “Maps Embed API” in Google Cloud).
 *
 * If neither is set, returns OpenStreetMap embed for the same region (no key) plus callers should show “Open in Google Maps”.
 */
export function aboutPageMapEmbed(): AboutMapEmbed {
  const pasted = process.env.NEXT_PUBLIC_ABOUT_GOOGLE_MAP_EMBED_URL?.trim();
  if (pasted) {
    return { kind: "iframe", src: pasted };
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  if (key) {
    const q = encodeURIComponent("Guangzhou, Guangdong Province, China");
    return {
      kind: "iframe",
      src: `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${q}&zoom=11`,
    };
  }

  return {
    kind: "osm-fallback",
    src: "https://www.openstreetmap.org/export/embed.html?bbox=113.05%2C22.95%2C113.48%2C23.38&layer=mapnik&marker=23.1291%2C113.2644",
  };
}
