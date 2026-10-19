import { SITE_ANNOUNCEMENT_BAR_HEIGHT_PX } from "@/lib/site-announcement";
import { getSiteAnnouncement } from "@/lib/site-announcement-queries";

/**
 * Reserve announcement bar height in first HTML paint without `headers()` /
 * `connection()` (those force the whole storefront layout dynamic).
 * Path-only hiding (checkout, account, blog, …) stays on the client bar,
 * which sets `--site-announcement-h: 0px` when the bar is not shown.
 */
export async function SiteAnnouncementRootStyle() {
  const announcement = await getSiteAnnouncement();
  const active =
    announcement.enabled &&
    announcement.slides.some((slide) => slide.message.trim().length > 0);
  const px = active ? SITE_ANNOUNCEMENT_BAR_HEIGHT_PX : 0;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{--site-announcement-h:${px}px}`,
      }}
    />
  );
}
