import type { Metadata } from "next";
import { Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeMechanicalHero } from "@/components/site/home-mechanical-hero";
import { HomeMovementCategories } from "@/components/site/home-movement-categories";
import { HomeFounderStorySection } from "@/components/site/home-founder-story-section";
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

async function HomeTrustNewsletterSection({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const deferredSectionStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "1000px",
  } as const;

  return (
    <>
      <section
        className="border-t border-line bg-white/55 py-14"
        style={deferredSectionStyle}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {(
            [
              { k: "10k+", labelKey: "statActiveCustomers" as const },
              { k: "25k+", labelKey: "statOrdersFulfilled" as const },
              { k: "50+", labelKey: "statCountriesShipped" as const },
              { k: "24/7", labelKey: "statSupport" as const },
            ] as const
          ).map((s) => (
            <div key={s.labelKey} className="text-center lg:text-left">
              <div className="font-serif text-4xl tabular-nums">{s.k}</div>
              <div className="mt-2 text-[12px] uppercase tracking-[0.16em] text-muted">
                {t(s.labelKey)}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <ShieldCheck
              className="mt-0.5 text-digital-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustSecureTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustSecureBody")}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <Globe2
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustGlobalTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustGlobalBody")}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-5">
            <Sparkles
              className="mt-0.5 text-luxe-dim"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <div className="text-sm font-semibold">{t("trustLaunchTitle")}</div>
              <div className="mt-1 text-sm text-muted">{t("trustLaunchBody")}</div>
            </div>
          </div>
        </div>
      </section>

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
    </>
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
      <HomeMechanicalHero />
      <Suspense fallback={<HomeSpotlightSectionFallback />}>
        <HomeMovementCategories />
      </Suspense>
      <Suspense fallback={<HomeProductSliderSectionFallback />}>
        <HomeRecommendedAsyncSection locale={locale} />
      </Suspense>
      <Suspense fallback={<HomeSpotlightSectionFallback />}>
        <HomeDigitempSpotlightAsyncSection locale={locale} />
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
        <HomeTrustNewsletterSection locale={locale} />
      </Suspense>
    </div>
  );
}
