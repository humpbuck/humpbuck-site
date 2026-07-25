import type { SiteAnnouncementData } from "@/lib/site-announcement";

/**
 * Announcement bar is one storefront message for every locale.
 * Prefer merchant CMS slides; use `Announcement.message` only when CMS is empty.
 */
export function resolveAnnouncementMessage(
  _locale: string,
  cmsMessage: string | undefined | null,
  i18nMessage: string,
): string {
  const cms = String(cmsMessage ?? "").trim();
  const i18n = String(i18nMessage ?? "").trim();
  return cms || i18n;
}

export function resolveSiteAnnouncementForLocale(
  locale: string,
  announcement: SiteAnnouncementData,
  i18nMessage: string,
): SiteAnnouncementData {
  return {
    ...announcement,
    slides: announcement.slides.map((slide) => ({
      ...slide,
      message: resolveAnnouncementMessage(locale, slide.message, i18nMessage),
    })),
  };
}
