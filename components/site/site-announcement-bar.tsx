"use client";

import { usePathname } from "@/i18n/navigation";
import { SiteAnnouncementCarousel } from "@/components/site/site-announcement-carousel";
import { SiteAnnouncementScrollShell } from "@/components/site/site-announcement-scroll-shell";
import {
  announcementBarTextColor,
  SITE_ANNOUNCEMENT_BAR_HEIGHT_PX,
  type SiteAnnouncementData,
} from "@/lib/site-announcement";
import { isStorefrontAnnouncementPathname } from "@/lib/storefront-home-path";

export { SITE_ANNOUNCEMENT_BAR_HEIGHT_PX };

export function SiteAnnouncementBar({
  enabled,
  slides,
  backgroundColor,
}: SiteAnnouncementData) {
  const pathname = usePathname();
  const activeSlides = slides.filter((slide) => slide.message.trim().length > 0);
  const show =
    enabled &&
    activeSlides.length > 0 &&
    isStorefrontAnnouncementPathname(pathname);

  if (!show) {
    return (
      <style
        dangerouslySetInnerHTML={{ __html: `:root{--site-announcement-h:0px}` }}
      />
    );
  }

  const textColor = announcementBarTextColor(backgroundColor);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root{--site-announcement-h:${SITE_ANNOUNCEMENT_BAR_HEIGHT_PX}px}`,
        }}
      />
      <SiteAnnouncementScrollShell backgroundColor={backgroundColor}>
        <SiteAnnouncementCarousel slides={activeSlides} textColor={textColor} />
      </SiteAnnouncementScrollShell>
    </>
  );
}
