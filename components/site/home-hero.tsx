import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { StorefrontImage } from "@/components/site/storefront-image";
import { homeHeroDesktopWebpUrl, homeHeroMobileWebpUrl } from "@/lib/r2";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

export async function HomeHero() {
  const [t, content] = await Promise.all([
    getTranslations("Home"),
    getSiteHomeContent(),
  ]);

  const heroMobileSrc =
    content.heroMobileImageUrl || homeHeroMobileWebpUrl();
  const heroDesktopSrc =
    content.heroDesktopImageUrl || homeHeroDesktopWebpUrl();
  const heroAlt = content.heroImageAlt || t("mechanicalHeroImageAlt");
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
        className={`relative z-10 mx-auto flex min-h-0 flex-1 flex-col ${heroMinH} w-full max-w-7xl px-[clamp(1rem,4.5vw,1.75rem)] pt-[clamp(0.5rem,1.75svh,1rem)] pb-[clamp(2.75rem,4.5svh,3.5rem)] md:px-6 md:pt-0 md:pb-0 lg:px-8`}
      >
        <div className="hidden shrink-0 md:block md:flex-[2]" aria-hidden />

        <div className="my-auto flex w-full max-w-xl flex-col gap-[clamp(0.75rem,2svh,1.375rem)] md:my-0 md:shrink-0 md:gap-[clamp(0.875rem,2.4svh,1.5rem)]">
          <p className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[clamp(9px,2.4vw,10px)] font-semibold uppercase tracking-[0.16em] text-white/80 md:text-[10px] md:tracking-[0.2em]">
            {content.heroBadge || t("mechanicalHeroBadge")}
          </p>

          <h1
            id="home-hero-heading"
            className="font-serif text-[clamp(1.625rem,4.8vw+0.65rem,3.25rem)] font-normal leading-[1.2] tracking-[-0.02em] min-[390px]:leading-[1.22] min-[430px]:leading-[1.24] md:leading-[1.08]"
          >
            {content.heroTitle || t("mechanicalHeroTitle")}
          </h1>

          <p className="max-w-[min(100%,22.5rem)] text-[clamp(0.9375rem,2.6vw,1.0625rem)] leading-[1.72] text-white/88 min-[390px]:leading-[1.78] min-[430px]:leading-[1.82] md:max-w-prose md:text-lg md:leading-relaxed md:text-white/82">
            {content.heroLead || t("mechanicalHeroLead")}
          </p>

          <div className="flex flex-wrap gap-x-2.5 gap-y-2.5 md:gap-2">
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[clamp(8px,2.2vw,10px)] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3 md:py-1.5 md:tracking-[0.14em]">
              {content.heroChip1 || t("mechanicalHeroChipAutomatic")}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[clamp(8px,2.2vw,10px)] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3 md:py-1.5 md:tracking-[0.14em]">
              {content.heroChip2 || t("mechanicalHeroChipSkeleton")}
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[clamp(8px,2.2vw,10px)] font-semibold uppercase tracking-[0.12em] text-white/88 md:px-3 md:py-1.5 md:tracking-[0.14em]">
              {content.heroChip3 || t("mechanicalHeroChipFinishing")}
            </span>
          </div>

          <div className="flex flex-col items-start gap-[clamp(1rem,2.8svh,1.375rem)] sm:flex-row sm:flex-wrap sm:items-center md:gap-4">
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#080808] transition hover:bg-white/90"
            >
              {content.heroCtaShop || t("mechanicalHeroCtaShop")}
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
