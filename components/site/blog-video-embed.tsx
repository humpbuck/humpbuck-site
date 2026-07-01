import type { BlogVideoAspectRatio } from "@/lib/blog-article-blocks";
import {
  blogVideoAspectClass,
  isDirectVideoUrl,
  youtubeAspectFallback,
  youtubeEmbedUrl,
} from "@/lib/blog-video";

type BlogVideoEmbedProps = {
  src: string;
  aspectRatio: BlogVideoAspectRatio;
  title?: string;
};

export function BlogVideoEmbed({ src, aspectRatio, title }: BlogVideoEmbedProps) {
  const trimmed = src.trim();
  if (!trimmed) return null;

  const label = title?.trim() || "Blog video";
  const yt = youtubeEmbedUrl(trimmed);

  if (yt) {
    const effectiveAspect = youtubeAspectFallback(aspectRatio);
    const aspectClass = blogVideoAspectClass(effectiveAspect);
    const portrait = effectiveAspect === "9:16";

    return (
      <figure
        className={`my-4 flex justify-center ${portrait ? "px-4 sm:px-8" : ""}`}
      >
        <div
          className={`w-full overflow-hidden rounded-2xl border border-line bg-black/80 ${aspectClass} ${portrait ? "max-w-[min(100%,360px)]" : "max-w-[min(100%,896px)]"}`}
        >
          <iframe
            title={label}
            src={yt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      </figure>
    );
  }

  if (isDirectVideoUrl(trimmed)) {
    if (aspectRatio === "auto") {
      return (
        <figure className="my-4 flex justify-center">
          <video
            title={label}
            controls
            playsInline
            preload="metadata"
            className="max-h-[min(80vh,720px)] w-auto max-w-full rounded-2xl border border-line bg-black/80 object-contain"
          >
            <source src={trimmed} />
          </video>
        </figure>
      );
    }

    const aspectClass = blogVideoAspectClass(aspectRatio);
    const portrait = aspectRatio === "9:16";

    return (
      <figure
        className={`my-4 flex justify-center ${portrait ? "px-4 sm:px-8" : ""}`}
      >
        <div
          className={`w-full overflow-hidden rounded-2xl border border-line bg-black/80 ${aspectClass} ${portrait ? "max-w-[min(100%,360px)]" : "max-w-[min(100%,896px)]"}`}
        >
          <video
            title={label}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          >
            <source src={trimmed} />
          </video>
        </div>
      </figure>
    );
  }

  return null;
}
