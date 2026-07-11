import { headers } from "next/headers";
import {
  SITE_ANNOUNCEMENT_BAR_HEIGHT_PX,
} from "@/lib/site-announcement";
import { getSiteAnnouncement } from "@/lib/site-announcement-queries";
import { isStorefrontAnnouncementPathname } from "@/lib/storefront-home-path";

/** Reserve announcement bar height in first HTML paint (avoids CLS on home / product). */
export async function SiteAnnouncementRootStyle() {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  if (!isStorefrontAnnouncementPathname(pathname)) return null;

  const announcement = await getSiteAnnouncement();
  const activeSlides = announcement.slides.filter(
    (slide) => slide.message.trim().length > 0,
  );
  if (!announcement.enabled || activeSlides.length === 0) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{--site-announcement-h:${SITE_ANNOUNCEMENT_BAR_HEIGHT_PX}px}`,
      }}
    />
  );
}
