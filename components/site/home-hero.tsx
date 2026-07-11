import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import {
  heroMinH,
  HomeHeroImageLayer,
  HomeHeroImageOverlays,
} from "@/components/site/home-hero-image-layer";
import { homeHeroDesktopWebpUrl, homeHeroMobileWebpUrl } from "@/lib/r2";
import { resolveHomeCmsText } from "@/lib/site-home-cms-locale";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

function HomeHeroTextSkeleton() {
  return (
    <div
      className={`relative z-10 mx-auto flex min-h-0 flex-1 flex-col ${heroMinH} w-full max-w-7xl animate-pulse px-[clamp(1rem,4.5vw,1.75rem)] py-[clamp(1.5rem,4svh,2.5rem)] md:px-6 md:py-0 lg:px-8`}
      aria-hidden
    >
      <div className="hidden shrink-0 md:block md:flex-[2]" />
      <div className="my-auto w-full max-w-xl md:my-0 md:shrink-0">
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

  const heroMobileSrc =
    content.heroMobileImageUrl || homeHeroMobileWebpUrl();
  const heroDesktopSrc =
    content.heroDesktopImageUrl || homeHeroDesktopWebpUrl();
  const heroAlt = resolveHomeCmsText(
    locale,
    content.heroImageAlt,
    t("mechanicalHeroImageAlt"),
  );
  const cmsOverridesImages =
    Boolean(content.heroMobileImageUrl?.trim()) ||
    Boolean(content.heroDesktopImageUrl?.trim());

  return (
    <>
      {cmsOverridesImages ? (
        <div className="absolute inset-0 z-0">
          <HomeHeroImageLayer
            mobileSrc={heroMobileSrc}
            desktopSrc={heroDesktopSrc}
            alt={heroAlt}
          />
        </div>
      ) : null}
      <div
        className={`relative z-10 mx-auto flex min-h-0 flex-1 flex-col ${heroMinH} w-full max-w-7xl px-[clamp(1rem,4.5vw,1.75rem)] py-[clamp(1.5rem,4svh,2.5rem)] md:px-6 md:py-0 lg:px-8`}
      >
        <div className="hidden shrink-0 md:block md:flex-[2]" aria-hidden />

        <div className="my-auto w-full max-w-xl md:my-0 md:shrink-0">
          <div className="flex flex-col">
            <p className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 md:tracking-[0.2em]">
              {resolveHomeCmsText(
                locale,
                content.heroBadge,
                t("mechanicalHeroBadge"),
              )}
            </p>

            <h1
              id="home-hero-heading"
              className="mt-4 font-serif text-[clamp(1.75rem,5vw+0.5rem,3.25rem)] font-normal leading-[1.15] tracking-[-0.02em] md:mt-5 md:leading-[1.08]"
            >
              {resolveHomeCmsText(
                locale,
                content.heroTitle,
                t("mechanicalHeroTitle"),
              )}
            </h1>

            <p className="mt-5 max-w-[min(100%,24rem)] text-[clamp(0.9375rem,2.5vw,1.0625rem)] leading-[1.75] text-white/86 md:mt-6 md:max-w-prose md:text-lg md:leading-[1.7] md:text-white/82">
              {resolveHomeCmsText(
                locale,
                content.heroLead,
                t("mechanicalHeroLead"),
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
                {resolveHomeCmsText(
                  locale,
                  content.heroChip1,
                  t("mechanicalHeroChipAutomatic"),
                )}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
                {resolveHomeCmsText(
                  locale,
                  content.heroChip2,
                  t("mechanicalHeroChipSkeleton"),
                )}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
                {resolveHomeCmsText(
                  locale,
                  content.heroChip3,
                  t("mechanicalHeroChipFinishing"),
                )}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3.5 sm:flex-row sm:flex-wrap sm:items-center md:mt-10 md:gap-5">
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#080808] transition hover:bg-white/90 md:px-7 md:py-2.5 md:text-xs"
            >
              {resolveHomeCmsText(
                locale,
                content.heroCtaShop,
                t("mechanicalHeroCtaShop"),
              )}
            </Link>
            <HumpbuckSocialLinks
              variant="hero"
              labels={{
                facebook: t("socialFacebookAria"),
                instagram: t("socialInstagramAria"),
                youtube: t("socialYoutubeAria"),
                tiktok: t("socialTiktokAria"),
              }}
            />
          </div>
        </div>

        <div className="hidden shrink-0 md:block md:flex-[3]" aria-hidden />
      </div>
    </>
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
