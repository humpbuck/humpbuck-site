import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShopCatalogAsyncSection } from "@/components/site/shop-catalog-async-section";
import { ShopProductGridFallback } from "@/components/site/route-section-fallbacks";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

/** Keep in sync with `STOREFRONT_ISR_SECONDS`. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shop" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${pathPrefix}/product`,
      languages: storefrontHreflangLanguages("/product"),
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function ProductCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ series?: string; movement?: string; audience?: string; profile?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");
  const { series: seriesParam, movement: movementParam, audience: audienceParam, profile: profileParam } =
    await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 max-w-full font-serif text-[clamp(0.75rem,1.8vw+0.42rem,1.625rem)] leading-snug tracking-[-0.015em] whitespace-nowrap">
          {t("title")}
        </h1>
      </div>

      <Suspense
        key={[seriesParam, movementParam, audienceParam, profileParam].join("|")}
        fallback={<ShopProductGridFallback />}
      >
        <ShopCatalogAsyncSection
          locale={locale}
          seriesParam={seriesParam}
          movementParam={movementParam}
          audienceParam={audienceParam}
          profileParam={profileParam}
        />
      </Suspense>
    </div>
  );
}
