import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { StorefrontImage } from "@/components/site/storefront-image";
import { homeHeroDesktopWebpUrl, homeHeroMobileWebpUrl } from "@/lib/r2";

export async function HomeHero() {
  const t = await getTranslations("Home");
  const heroMobileSrc = homeHeroMobileWebpUrl();
  const heroDesktopSrc = homeHeroDesktopWebpUrl();
  const heroAlt = t("mechanicalHeroImageAlt");

  return (
    <section
      className="relative min-h-[min(48vh,507px)] overflow-hidden border-b border-white/10 bg-[#080808] text-white md:min-h-[calc(100vh-var(--site-announcement-h,0px)-80px)]"
      aria-labelledby="home-hero-heading"
    >
      <div className="absolute inset-0">
        <div className="relative h-full min-h-[min(48vh,507px)] w-full md:min-h-[calc(100vh-var(--site-announcement-h,0px)-80px)]">
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
          className="absolute inset-0 bg-linear-to-t from-[#080808]/70 via-transparent to-[#080808]/15 md:from-[#080808]/40"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[min(48vh,507px)] max-w-7xl flex-col px-4 sm:px-6 md:min-h-[calc(100vh-var(--site-announcement-h,0px)-80px)] lg:px-8">
        <div className="flex-[2] shrink-0" aria-hidden />
        <div className="max-w-xl shrink-0">
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75 md:py-1.5 md:text-[10px] md:tracking-[0.2em]">
            {t("mechanicalHeroBadge")}
          </p>
          <h1
            id="home-hero-heading"
            className="mt-3 font-serif text-[clamp(1.75rem,4.5vw+0.35rem,3.25rem)] font-normal leading-[1.08] tracking-[-0.02em] md:mt-6"
          >
            {t("mechanicalHeroTitle")}
          </h1>
          <p className="mt-2.5 max-w-prose text-sm leading-[1.55] text-white/82 md:mt-5 md:text-lg md:leading-relaxed">
            {t("mechanicalHeroLead")}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 md:mt-7 md:gap-2">
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white/85 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
              {t("mechanicalHeroChipAutomatic")}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white/85 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
              {t("mechanicalHeroChipSkeleton")}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white/85 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.14em]">
              {t("mechanicalHeroChipFinishing")}
            </span>
          </div>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10 md:gap-4">
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#080808] transition hover:bg-white/90"
            >
              {t("mechanicalHeroCtaShop")}
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
        <div className="flex-[3] shrink-0" aria-hidden />
      </div>
    </section>
  );
}
