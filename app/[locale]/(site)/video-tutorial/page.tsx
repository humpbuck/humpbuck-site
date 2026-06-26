import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { listVideoTutorials, type VideoTutorial } from "@/lib/video-tutorials";

/** Cached until admin video saves or deploy; no time-based expiry. */
export const revalidate = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "VideoTutorials" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/video-tutorial`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/video-tutorial"),
    },
  };
}

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

function youtubeEmbedFromAny(raw: string): string | null {
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
        <video className="h-full w-full object-cover" controls playsInline preload="metadata">
          <source src={item.url} />
        </video>
      </div>
    );
  }
  return (
    <div className={cls}>
      <iframe title={item.title} src={item.url} allowFullScreen className="h-full w-full border-0" />
    </div>
  );
}

export default async function VideoTutorialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("VideoTutorials");
  const tutorials = await listVideoTutorials();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t("kicker")}</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{t("pageTitle")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{t("intro")}</p>
      {tutorials.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white/60 p-8 text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((item) => (
            <article
              key={item.productSlug}
              className="space-y-3 rounded-2xl border border-line bg-white/70 p-4"
            >
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                {t("primaryVideo")}
              </p>
              <TutorialMedia item={item} />
              {youtubeEmbedFromAny(item.youtubeUrl) ? (
                <div className="space-y-2 border-t border-line pt-3">
                  <p className="text-xs font-medium text-muted">{t("backupYoutubeHint")}</p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    {t("backupVideo")}
                  </p>
                  <div
                    className={`w-full overflow-hidden rounded-2xl border border-line bg-black/80 ${ratioClass(item.aspectRatio)}`}
                  >
                    <iframe
                      title={`${item.title} — ${t("backupIframeTitleSuffix")}`}
                      src={youtubeEmbedFromAny(item.youtubeUrl) ?? ""}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                </div>
              ) : externalLink(item.youtubeUrl) ? (
                <div className="space-y-2 border-t border-line pt-3">
                  <p className="text-xs font-medium text-muted">{t("backupLinkHint")}</p>
                  <a
                    href={externalLink(item.youtubeUrl) ?? "#"}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-paper"
                  >
                    {t("openBackupVideo")}
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
