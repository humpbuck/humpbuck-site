import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeHero } from "@/components/site/home-hero";
import { HomeMomentsSection } from "@/components/site/home-moments-section";
import { HomeCouponSection } from "@/components/site/home-coupon-section";
import { HomeMovementCategories } from "@/components/site/home-movement-categories";
import { HomeContactUsSection } from "@/components/site/home-contact-us-section";
import { HomeFounderStorySection } from "@/components/site/home-founder-story-section";
import { HomeCustomerCertaintySection } from "@/components/site/home-customer-certainty-section";
import { NewsletterSubscribe } from "@/components/site/NewsletterSubscribe";
import {
  HomeCategorySlidersAsyncSection,
  HomeBlogCarouselAsyncSection,
  HomeDigitempSpotlightAsyncSection,
  HomeRecommendedAsyncSection,
} from "@/components/site/home-page-async-sections";
import {
  HomeCategorySlidersFallback,
  HomeProductSliderSectionFallback,
  HomeSpotlightSectionFallback,
} from "@/components/site/route-section-fallbacks";
import { routing } from "@/i18n/routing";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

/** Cached until admin catalog saves or deploy; no time-based expiry. */
export const revalidate = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  const base = getSiteUrl();
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const openGraphUrl = pathPrefix ? `${base}${pathPrefix}` : base;

  return {
    title: {
      absolute: t("metaTitle"),
    },
    description: t("metaDescription"),
    alternates: {
      canonical: pathPrefix ? `${pathPrefix}/` : "/",
      languages: storefrontHreflangLanguages("/"),
    },
    openGraph: {
      url: openGraphUrl,
      type: "website",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [defaultOgImage.url],
    },
  };
}

async function HomeNewsletterSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const deferredSectionStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "420px",
  } as const;

  return (
    <section
      id="newsletter"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
      style={deferredSectionStyle}
    >
      <div className="rounded-3xl border border-line bg-white/70 p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("newsletterKicker")}
            </div>
            <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
              {t("newsletterTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted">{t("newsletterBody")}</p>
          </div>
          <NewsletterSubscribe />
        </div>
      </div>
    </section>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <HomeHero />
      <Suspense fallback={null}>
        <HomeMomentsSection />
      </Suspense>
      <Suspense fallback={null}>
        <HomeCouponSection />
      </Suspense>
      <Suspense fallback={<HomeSpotlightSectionFallback />}>
        <HomeMovementCategories />
      </Suspense>
      <Suspense fallback={<HomeProductSliderSectionFallback />}>
        <HomeRecommendedAsyncSection locale={locale} />
      </Suspense>
      <Suspense fallback={<HomeSpotlightSectionFallback />}>
        <HomeDigitempSpotlightAsyncSection locale={locale} />
      </Suspense>
      <Suspense fallback={null}>
        <HomeCustomerCertaintySection />
      </Suspense>
      <Suspense fallback={<HomeCategorySlidersFallback />}>
        <HomeCategorySlidersAsyncSection locale={locale} />
      </Suspense>
      <Suspense fallback={null}>
        <HomeBlogCarouselAsyncSection locale={locale} />
      </Suspense>
      <Suspense fallback={null}>
        <HomeFounderStorySection />
      </Suspense>
      <Suspense fallback={null}>
        <HomeContactUsSection />
      </Suspense>
      <Suspense fallback={null}>
        <HomeNewsletterSection locale={locale} />
      </Suspense>
    </div>
  );
}
