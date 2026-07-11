import { getLocale, getTranslations } from "next-intl/server";
import { SiteAnnouncementBar } from "@/components/site/site-announcement-bar";
import { resolveSiteAnnouncementForLocale } from "@/lib/site-announcement-locale";
import { getSiteAnnouncement } from "@/lib/site-announcement-queries";

export async function SiteAnnouncementBarAsync() {
  const [locale, announcement, t] = await Promise.all([
    getLocale(),
    getSiteAnnouncement(),
    getTranslations("Announcement"),
  ]);

  const localized = resolveSiteAnnouncementForLocale(
    locale,
    announcement,
    t("message"),
  );

  return <SiteAnnouncementBar {...localized} />;
}
