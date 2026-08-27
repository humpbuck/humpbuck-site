import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { ShopCatalogAsyncSection } from "@/components/site/shop-catalog-async-section";
import { ShopProductGridFallback } from "@/components/site/route-section-fallbacks";
import { WatchCategorySeoBlock } from "@/components/site/watch-category-seo-block";
import { routing } from "@/i18n/routing";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { getWatchCollectionLocalizedCopy } from "@/lib/watch-collection-copy";

/** Cached until admin catalog saves or deploy; no time-based expiry. */
export const revalidate = false;

export async function buildWatchCollectionMetadata(
  locale: string,
  categorySlug: string | null,
): Promise<Metadata> {
  const copy = await getWatchCollectionLocalizedCopy(locale, categorySlug);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const pageUrl = `${getSiteUrl()}${pathPrefix}${copy.path}`;

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: `${pathPrefix}${copy.path}`,
      languages: storefrontHreflangLanguages(copy.path),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: copy.metaTitle,
      description: copy.metaDescription,
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.metaDescription,
      images: [defaultOgImage.url],
    },
  };
}

export async function WatchCollectionPage({
  locale,
  categorySlug,
}: {
  locale: string;
  categorySlug: string | null;
}) {
  setRequestLocale(locale);
  const copy = await getWatchCollectionLocalizedCopy(locale, categorySlug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {copy.kicker}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-[clamp(1.35rem,2.4vw+0.7rem,2.25rem)] leading-snug tracking-[-0.015em]">
          {copy.h1}
        </h1>
        {copy.subtitle ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-[15px]">
            {copy.subtitle}
          </p>
        ) : null}
        {copy.intro ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/80 sm:text-[15px]">
            {copy.intro}
          </p>
        ) : null}
      </div>

      <Suspense
        key={categorySlug ?? "all"}
        fallback={<ShopProductGridFallback />}
      >
        <ShopCatalogAsyncSection
          locale={locale}
          activeCategorySlug={categorySlug}
        />
      </Suspense>

      <WatchCategorySeoBlock copy={copy} />
    </div>
  );
}
