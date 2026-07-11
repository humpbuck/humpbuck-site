import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { StorefrontImage } from "@/components/site/storefront-image";
import { homeHeroDesktopWebpUrl, homeHeroMobileWebpUrl } from "@/lib/r2";
import { resolveHomeCmsText } from "@/lib/site-home-cms-locale";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

export async function HomeHero() {
  const [locale, t, content] = await Promise.all([
    getLocale(),
    getTranslations("Home"),
    getSiteHomeContent(),
  ]);

  const heroMobileSrc =
    content.heroMobileImageUrl || homeHeroMobileWebpUrl();
  const heroDesktopSrc =
    content.heroDesktopImageUrl || homeHeroDesktopWebpUrl();
  const heroAlt = resolveHomeCmsText(locale, content.heroImageAlt, t("mechanicalHeroImageAlt"));
  const heroMinH =
    "min-h-[calc((100svh-var(--site-announcement-h,0px)-72px)*0.85)] md:min-h-[calc(100vh-var(--site-announcement-h,0px)-80px)]";

  return (
    <section
      className={`relative flex flex-col ${heroMinH} overflow-hidden border-b border-white/10 bg-[#080808] text-white`}
      aria-labelledby="home-hero-heading"
    >
      <div className="absolute inset-0">
        <div className={`relative h-full w-full ${heroMinH}`}>
          <StorefrontImage
            src={heroMobileSrc}
            alt={heroAlt}
            fill
            priority
            fetchPriority="high"
            className="object-cover object-center md:hidden"
            sizes="100vw"
          />
          <StorefrontImage
            src={heroDesktopSrc}
            alt={heroAlt}
            fill
            priority
            fetchPriority="high"
            className="hidden object-cover object-center md:block"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0 bg-linear-to-r from-[#080808]/92 via-[#080808]/55 to-transparent md:via-[#080808]/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-[#080808]/75 via-[#080808]/20 to-transparent md:from-[#080808]/40 md:via-transparent md:to-[#080808]/15"
          aria-hidden
        />
      </div>

      <div
        className={`relative z-10 mx-auto flex min-h-0 flex-1 flex-col ${heroMinH} w-full max-w-7xl px-[clamp(1rem,4.5vw,1.75rem)] py-[clamp(1.5rem,4svh,2.5rem)] md:px-6 md:py-0 lg:px-8`}
      >
        <div className="hidden shrink-0 md:block md:flex-[2]" aria-hidden />

        <div className="my-auto w-full max-w-xl md:my-0 md:shrink-0">
          {/* Copy block — badge → headline → lead → chips */}
          <div className="flex flex-col">
            <p className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 md:tracking-[0.2em]">
              {resolveHomeCmsText(locale, content.heroBadge, t("mechanicalHeroBadge"))}
            </p>

            <h1
              id="home-hero-heading"
              className="mt-4 font-serif text-[clamp(1.75rem,5vw+0.5rem,3.25rem)] font-normal leading-[1.15] tracking-[-0.02em] md:mt-5 md:leading-[1.08]"
            >
              {resolveHomeCmsText(locale, content.heroTitle, t("mechanicalHeroTitle"))}
            </h1>

            <p className="mt-5 max-w-[min(100%,24rem)] text-[clamp(0.9375rem,2.5vw,1.0625rem)] leading-[1.75] text-white/86 md:mt-6 md:max-w-prose md:text-lg md:leading-[1.7] md:text-white/82">
              {resolveHomeCmsText(locale, content.heroLead, t("mechanicalHeroLead"))}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
                {resolveHomeCmsText(locale, content.heroChip1, t("mechanicalHeroChipAutomatic"))}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
                {resolveHomeCmsText(locale, content.heroChip2, t("mechanicalHeroChipSkeleton"))}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3.5 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
                {resolveHomeCmsText(locale, content.heroChip3, t("mechanicalHeroChipFinishing"))}
              </span>
            </div>
          </div>

          {/* Actions — shop + social, visually separated from copy */}
          <div className="mt-8 flex flex-col items-start gap-3.5 sm:flex-row sm:flex-wrap sm:items-center md:mt-10 md:gap-5">
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#080808] transition hover:bg-white/90 md:px-7 md:py-2.5 md:text-xs"
            >
              {resolveHomeCmsText(locale, content.heroCtaShop, t("mechanicalHeroCtaShop"))}
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
    </section>
  );
}
