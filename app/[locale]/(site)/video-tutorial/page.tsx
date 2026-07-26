import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VideoTutorialPlayers } from "@/components/site/video-tutorial-players";
import { routing } from "@/i18n/routing";
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
  return {
    title: content.title || t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/video-tutorial"),
    },
  };
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
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
