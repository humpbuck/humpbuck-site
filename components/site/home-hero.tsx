import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  heroMinH,
  HomeHeroImageLayer,
  HomeHeroImageOverlays,
} from "@/components/site/home-hero-image-layer";
import {
  HomeHeroCarousel,
  type HomeHeroSlide,
} from "@/components/site/home-hero-carousel";
import { homeHeroDesktopWebpUrl, homeHeroMobileWebpUrl } from "@/lib/r2";
import { resolveHomeCmsText } from "@/lib/site-home-cms-locale";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

function HomeHeroTextSkeleton() {
  return (
    <div
      className={`relative z-10 mx-auto flex min-h-0 flex-1 flex-col ${heroMinH} w-full max-w-7xl animate-pulse px-[clamp(1rem,4.5vw,1.75rem)] pt-[clamp(3.5rem,12svh,5.5rem)] pb-[clamp(1.5rem,4svh,2.5rem)] md:px-6 md:py-0 lg:px-8`}
      aria-hidden
    >
      <div className="hidden shrink-0 md:block md:flex-[2]" />
      <div className="mt-0 w-full max-w-xl shrink-0 md:my-0">
        <div className="h-7 w-40 rounded-full bg-white/10" />
        <div className="mt-5 h-12 w-full max-w-md rounded bg-white/10 md:mt-6" />
        <div className="mt-6 h-20 w-full max-w-sm rounded bg-white/10" />
        <div className="mt-6 flex gap-2">
          <div className="h-7 w-24 rounded-full bg-white/10" />
          <div className="h-7 w-28 rounded-full bg-white/10" />
          <div className="h-7 w-24 rounded-full bg-white/10" />
        </div>
        <div className="mt-10 h-10 w-36 rounded-full bg-white/15" />
      </div>
      <div className="hidden shrink-0 md:block md:flex-[3]" />
    </div>
  );
}

async function HomeHeroForeground() {
  const [locale, t, content] = await Promise.all([
    getLocale(),
    getTranslations("Home"),
    getSiteHomeContent(),
  ]);

  const anaDigiCmsMobile = content.heroMobileImageUrl?.trim() ?? "";
  const anaDigiCmsDesktop = content.heroDesktopImageUrl?.trim() ?? "";

  const slides: HomeHeroSlide[] = [
    {
      id: "automatic",
      badge: t("automaticHeroBadge"),
      title: t("automaticHeroTitle"),
      lead: t("automaticHeroLead"),
      chips: [
        t("automaticHeroChipAutomatic"),
        t("automaticHeroChipSteel"),
        t("automaticHeroChipSapphire"),
      ],
      cta: t("automaticHeroCtaShop"),
      ctaHref: "/products/automatic",
      alt: t("automaticHeroImageAlt"),
      headingAs: "h1",
    },
    {
      id: "ana-digi",
      badge: resolveHomeCmsText(
        locale,
        content.heroBadge,
        t("mechanicalHeroBadge"),
      ),
      title: resolveHomeCmsText(
        locale,
        content.heroTitle,
        t("mechanicalHeroTitle"),
      ),
      lead: resolveHomeCmsText(
        locale,
        content.heroLead,
        t("mechanicalHeroLead"),
      ),
      chips: (
        [
          [content.heroChip1, "mechanicalHeroChipAutomatic"],
          [content.heroChip2, "mechanicalHeroChipSkeleton"],
          [content.heroChip3, "mechanicalHeroChipFinishing"],
          [content.heroChip4, "mechanicalHeroChipDuT"],
          [content.heroChip5, "mechanicalHeroChipStW"],
        ] as const
      ).map(([cmsValue, messageKey]) =>
        resolveHomeCmsText(locale, cmsValue, t(messageKey)),
      ),
      cta: resolveHomeCmsText(
        locale,
        content.heroCtaShop,
        t("mechanicalHeroCtaShop"),
      ),
      ctaHref: "/products",
      alt: resolveHomeCmsText(
        locale,
        content.heroImageAlt,
        t("mechanicalHeroImageAlt"),
      ),
      mobileSrc: anaDigiCmsMobile || homeHeroMobileWebpUrl(),
      desktopSrc: anaDigiCmsDesktop || homeHeroDesktopWebpUrl(),
      headingAs: "h2",
    },
  ];

  return (
    <HomeHeroCarousel
      slides={slides}
      socialLabels={{
        facebook: t("socialFacebookAria"),
        instagram: t("socialInstagramAria"),
        youtube: t("socialYoutubeAria"),
        tiktok: t("socialTiktokAria"),
      }}
      goToLabel={t("heroCarouselGoTo")}
      carouselLabel={t("heroCarouselLabel")}
    />
  );
}

export function HomeHero() {
  return (
    <section
      className={`relative flex flex-col ${heroMinH} overflow-hidden border-b border-white/10 bg-[#080808] text-white`}
      aria-labelledby="home-hero-heading"
    >
      <div className="absolute inset-0 z-0">
        <HomeHeroImageLayer />
      </div>
      <Suspense fallback={<HomeHeroTextSkeleton />}>
        <HomeHeroForeground />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <HomeHeroImageOverlays />
      </div>
    </section>
  );
}
