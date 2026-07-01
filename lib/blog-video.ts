import type { BlogVideoAspectRatio } from "@/lib/blog-article-blocks";

export function youtubeEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\/+/, "");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function isDirectVideoUrl(raw: string): boolean {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(raw.trim());
}

export function blogVideoAspectClass(aspectRatio: BlogVideoAspectRatio): string {
  if (aspectRatio === "16:9") return "aspect-video";
  if (aspectRatio === "9:16") return "aspect-[9/16]";
  return "";
}

/** Effective aspect for iframe embeds when the author chose "auto". */
export function youtubeAspectFallback(aspectRatio: BlogVideoAspectRatio): BlogVideoAspectRatio {
  return aspectRatio === "auto" ? "16:9" : aspectRatio;
}
