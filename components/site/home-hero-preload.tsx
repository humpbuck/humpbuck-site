import {
  homeHeroAutomaticDesktopWebpUrl,
  homeHeroAutomaticMobileWebpUrl,
} from "@/lib/r2";

/** Hoisted to `<head>` — starts first-slide hero download before CMS copy resolves. */
export function HomeHeroPreload() {
  const mobile = homeHeroAutomaticMobileWebpUrl();
  const desktop = homeHeroAutomaticDesktopWebpUrl();

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={mobile}
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={desktop}
        media="(min-width: 768px)"
        fetchPriority="high"
      />
    </>
  );
}
