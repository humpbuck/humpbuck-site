import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VideoTutorialPlayers } from "@/components/site/video-tutorial-players";
import { youtubeEmbedUrl } from "@/lib/blog-video";
import { routing } from "@/i18n/routing";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { getSiteVideoTutorial } from "@/lib/site-video-tutorial-queries";

export const revalidate = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "VideoTutorials" });
  const content = await getSiteVideoTutorial();
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/video-tutorial`;
  const pageUrl = `${getSiteUrl()}${path}`;
  const title = content.title.trim() || t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/video-tutorial"),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title,
      description,
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage.url],
    },
  };
}

function VideoTutorialJsonLd({
  locale,
  path,
  title,
  description,
  r2VideoUrl,
  youtubeUrl,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  r2VideoUrl: string;
  youtubeUrl: string;
}) {
  const pageUrl = `${getSiteUrl()}${path}`;
  const videos: Record<string, string>[] = [];
  const r2 = r2VideoUrl.trim();
  const ytEmbed = youtubeEmbedUrl(youtubeUrl);

  if (r2) {
    videos.push({
      "@type": "VideoObject",
      name: title,
      description,
      contentUrl: r2,
    });
  }
  if (ytEmbed) {
    videos.push({
      "@type": "VideoObject",
      name: `${title} (YouTube)`,
      description,
      embedUrl: ytEmbed,
    });
  }

  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: pageUrl,
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", name: "HUMPBUCK", url: getSiteUrl() },
    ...(videos.length === 1
      ? { mainEntity: videos[0] }
      : videos.length > 1
        ? { mainEntity: videos }
        : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
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
  const content = await getSiteVideoTutorial();
  const pageTitle = content.title.trim() || t("pageTitle");
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/video-tutorial`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <VideoTutorialJsonLd
        locale={locale}
        path={path}
        title={pageTitle}
        description={t("metaDescription")}
        r2VideoUrl={content.r2VideoUrl}
        youtubeUrl={content.youtubeUrl}
      />
      <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
        {pageTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{t("intro")}</p>
      <VideoTutorialPlayers
        r2VideoUrl={content.r2VideoUrl}
        youtubeUrl={content.youtubeUrl}
        pageTitle={pageTitle}
        labels={{
          primaryR2: t("primaryR2"),
          backupYoutube: t("backupYoutube"),
          emptyPrimary: t("emptyPrimary"),
          emptyBackup: t("emptyBackup"),
        }}
      />
    </div>
  );
}
