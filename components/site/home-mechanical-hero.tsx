import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { StorefrontImage } from "@/components/site/storefront-image";
import { mechanicalHeroWebpUrl } from "@/lib/r2";

export async function HomeMechanicalHero() {
  const t = await getTranslations("Home");
  const heroSrc = mechanicalHeroWebpUrl();

  return (
    <section
      className="relative min-h-[min(72vh,760px)] overflow-hidden border-b border-white/10 bg-[#080808] text-white md:min-h-screen"
      aria-labelledby="home-mechanical-hero-heading"
    >
      <div className="absolute inset-0">
        <div className="relative h-full min-h-[min(72vh,760px)] w-full md:min-h-screen">
          <StorefrontImage
            src={heroSrc}
            alt={t("mechanicalHeroImageAlt")}
            fill
            priority
            fetchPriority="high"
            className="object-cover object-[70%_center] sm:object-[center_45%] md:object-center"
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

      <div className="relative z-10 mx-auto flex max-w-7xl min-h-[min(72vh,760px)] items-stretch px-4 pt-28 pb-16 sm:px-6 sm:py-20 md:min-h-screen md:items-center md:py-24 lg:py-28">
        <div className="max-w-xl">
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {t("mechanicalHeroBadge")}
          </p>
          <h1
            id="home-mechanical-hero-heading"
            className="mt-6 font-serif text-[clamp(2rem,5vw+0.5rem,3.25rem)] font-normal leading-[1.08] tracking-[-0.02em]"
          >
            {t("mechanicalHeroTitle")}
          </h1>
          <p className="mt-5 max-w-prose text-sm leading-[1.65] text-white/82 md:text-lg md:leading-relaxed">
            {t("mechanicalHeroLead")}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
              {t("mechanicalHeroChipAutomatic")}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
              {t("mechanicalHeroChipSkeleton")}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
              {t("mechanicalHeroChipFinishing")}
            </span>
          </div>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
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
      </div>
    </section>
  );
}
