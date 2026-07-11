import { getLocale, getTranslations } from "next-intl/server";
import { HomeCouponPrompt } from "@/components/site/home-coupon-prompt";
import { StorefrontImage } from "@/components/site/storefront-image";
import { routing } from "@/i18n/routing";
import { resolveHomeCmsText } from "@/lib/site-home-cms-locale";
import { resolveCouponTaglineLines } from "@/lib/site-home-content";
import { getHomepageFeaturedCoupon } from "@/lib/homepage-coupon-queries";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

export async function HomeCouponSection() {
  const [locale, t, content, featuredCoupon] = await Promise.all([
    getLocale(),
    getTranslations("Home"),
    getSiteHomeContent(),
    getHomepageFeaturedCoupon(),
  ]);

  const title = resolveHomeCmsText(locale, content.couponTitle, t("couponTitle"));
  const question = resolveHomeCmsText(locale, content.couponQuestion, t("couponQuestion"));
  const taglineLines = resolveCouponTaglineLines(
    locale === routing.defaultLocale ? content.couponTagline : "",
    t("couponTaglineLine1"),
    t("couponTaglineLine2"),
  );
  const backgroundUrl = content.couponBackgroundImageUrl.trim();

  return (
    <section
      className="relative overflow-hidden border-b border-line bg-paper"
      aria-labelledby="home-coupon-heading"
    >
      {backgroundUrl ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <StorefrontImage
            src={backgroundUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-paper/88" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-paper via-white/40 to-paper"
          aria-hidden
        />
      )}

      <div className="relative z-20 mx-auto flex min-h-[min(42vh,420px)] max-w-7xl items-center px-4 py-10 pb-14 sm:px-6 sm:py-12 sm:pb-16 md:py-14 md:pb-16 lg:py-16">
        <h2 id="home-coupon-heading" className="sr-only">
          {title}
        </h2>
        <HomeCouponPrompt
          kicker={t("couponKicker")}
          title={title}
          question={question}
          inputPlaceholder={t("couponInputPlaceholder")}
          confirmLabel={t("couponConfirm")}
          taglineLine1={taglineLines.line1}
          taglineLine2={taglineLines.line2}
          couponCode={featuredCoupon?.code ?? null}
          couponRewardLabel={t("couponRewardLabel")}
          couponNoCodeMessage={t("couponNoCodeMessage")}
          closeLabel={t("couponModalClose")}
        />
      </div>
    </section>
  );
}
