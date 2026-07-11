import { routing } from "@/i18n/routing";
import type { SiteAnnouncementData } from "@/lib/site-announcement";

/** CMS stores English; non-default locales prefer `messages/{locale}.json`. */
export function resolveAnnouncementMessage(
  locale: string,
  cmsMessage: string | undefined | null,
  i18nMessage: string,
): string {
  const cms = String(cmsMessage ?? "").trim();
  const i18n = String(i18nMessage ?? "").trim();
  if (locale !== routing.defaultLocale) {
    return i18n || cms;
  }
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
