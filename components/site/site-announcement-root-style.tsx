import { headers } from "next/headers";
import { SITE_ANNOUNCEMENT_BAR_HEIGHT_PX } from "@/lib/site-announcement";
import { isStorefrontAnnouncementPathname } from "@/lib/storefront-home-path";

/**
 * Reserve announcement bar height in first HTML paint — no DB query.
 * Reads pathname from middleware header only; the client `SiteAnnouncementBar`
 * clears the variable if the bar is disabled.
 */
export async function SiteAnnouncementRootStyle() {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  if (!isStorefrontAnnouncementPathname(pathname)) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{--site-announcement-h:${SITE_ANNOUNCEMENT_BAR_HEIGHT_PX}px}`,
      }}
    />
  );
}
