/** Physical store / workshop address shown on the About page. */
export const HUMPBUCK_STORE_ADDRESS =
  "No. 112, Kanghua East Road, Dong District, Zhongshan City, Guangdong Province, China" as const;

/**
 * Opens Google Maps search for the store — works without API keys.
 */
export const HUMPBUCK_STORE_MAPS_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HUMPBUCK_STORE_ADDRESS)}` as const;

/** @deprecated Use {@link HUMPBUCK_STORE_MAPS_URL}. */
export const GUANGZHOU_GOOGLE_MAPS_URL = HUMPBUCK_STORE_MAPS_URL;

export type AboutMapEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "osm-fallback"; src: string };

/**
 * Google Maps embed (preferred), in order:
 * 1. `NEXT_PUBLIC_ABOUT_GOOGLE_MAP_EMBED_URL` — paste full iframe `src` from Google Maps → Share → **Embed a map**.
 * 2. `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` — Maps Embed API key, place query fixed to the store address (enable “Maps Embed API” in Google Cloud).
 *
 * If neither is set, returns OpenStreetMap embed for the Zhongshan region (no key) plus callers should show “Open in Google Maps”.
 */
export function aboutPageMapEmbed(): AboutMapEmbed {
  const pasted = process.env.NEXT_PUBLIC_ABOUT_GOOGLE_MAP_EMBED_URL?.trim();
  if (pasted) {
    return { kind: "iframe", src: pasted };
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  if (key) {
    const q = encodeURIComponent(HUMPBUCK_STORE_ADDRESS);
    return {
      kind: "iframe",
      src: `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${q}&zoom=15`,
    };
  }

  return {
    kind: "osm-fallback",
    src: "https://www.openstreetmap.org/export/embed.html?bbox=113.35%2C22.48%2C113.44%2C22.54&layer=mapnik&marker=22.516%2C113.405",
  };
}
