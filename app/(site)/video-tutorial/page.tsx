import type { Metadata } from "next";
import { listVideoTutorials, type VideoTutorial } from "@/lib/video-tutorials";

export const metadata: Metadata = {
  title: "Video tutorial",
  alternates: { canonical: "/video-tutorial" },
};
export const dynamic = "force-dynamic";

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
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

function ratioClass(ratio: VideoTutorial["aspectRatio"]): string {
  if (ratio === "16:9") return "aspect-video";
  if (ratio === "1:1") return "aspect-square";
  return "aspect-[9/16]";
}

function externalLink(raw: string): string | null {
  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function modelLabel(slug: string): string {
  return slug.replace(/-/g, " ").toUpperCase();
}

function TutorialMedia({ item }: { item: VideoTutorial }) {
  const yt = youtubeEmbedUrl(item.url);
  const videoLike = /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(item.url);
  const cls = `w-full overflow-hidden rounded-2xl border border-line bg-black/80 ${ratioClass(item.aspectRatio)}`;
  if (yt) {
    return (
      <div className={cls}>
        <iframe
          title={item.title}
          src={yt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }
  if (videoLike) {
    return (
      <div className={cls}>
        <video
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
        >
          <source src={item.url} />
        </video>
      </div>
    );
  }
  return (
    <div className={cls}>
      <iframe
        title={item.title}
        src={item.url}
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}

export default async function VideoTutorialPage() {
  const tutorials = await listVideoTutorials();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Video tutorial
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
        Product video tutorials
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Hands-on tutorial videos for each product. Supports R2 links, YouTube, and other embeddable platforms.
      </p>
      {tutorials.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white/60 p-8 text-sm text-muted">
          No tutorial videos yet.
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((item) => (
            <article key={item.productSlug} className="space-y-3">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <TutorialMedia item={item} />
              {externalLink(item.youtubeUrl) ? (
                <a
                  href={externalLink(item.youtubeUrl) ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-paper"
                >
                  {modelLabel(item.productSlug)} video tutorial link
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
