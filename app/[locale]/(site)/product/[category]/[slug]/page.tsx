import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { readCatalogBuildSlugs } from "@/lib/catalog-build-slugs";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import {
  normalizeProductPathCategory,
  productHref,
  productPathCategoryFromProduct,
  PRODUCT_PATH_CATEGORIES,
} from "@/lib/product-path";
import { resolveProductForPdpSlug } from "@/lib/product-path-server";
import { absoluteOgImageUrl, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { permanentRedirectWithLocale } from "@/lib/storefront-redirect";
import { routing } from "@/i18n/routing";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import { ProductReviewsSection } from "@/components/site/ProductReviewsSection";
import { ProductPdpScrollTop } from "@/components/site/product-pdp-scroll-top";
import { SilentErrorBoundary } from "@/components/site/silent-error-boundary";
import {
  ProductPdpMainAsyncSection,
  ProductPdpRelatedAsyncSection,
} from "@/components/site/product-pdp-async-sections";
import {
  ProductPdpMainFallback,
  ProductPdpRelatedFallback,
  ProductPdpReviewsFallback,
} from "@/components/site/route-section-fallbacks";

/** Cached until admin catalog saves or deploy; no time-based expiry. */
export const revalidate = false;

export async function generateStaticParams() {
  const products: Array<{ category: string; slug: string }> = [];
  try {
    for (const product of await getMergedCatalogProducts()) {
      const slug = product.slug.trim();
      if (!slug) continue;
      products.push({
        category: productPathCategoryFromProduct(product),
        slug,
      });
    }
  } catch (err) {
    console.error("[product] generateStaticParams: catalog load failed.", err);
  }
  // Build-time fallback when D1 is unavailable — assume ana-digi until hydrated.
  for (const slug of readCatalogBuildSlugs()) {
    if (products.some((p) => p.slug === slug)) continue;
    products.push({ category: "ana-digi", slug });
  }
  return routing.locales.flatMap((locale) =>
    products.map(({ category, slug }) => ({ locale, category, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category: categoryParam, slug: slugParam } = await params;
  const t = await getTranslations({ locale, namespace: "Product" });
  const productRaw = await resolveProductForPdpSlug(slugParam);
  if (!productRaw) return { title: t("metaFallbackTitle") };

  const canonicalCategory = productPathCategoryFromProduct(productRaw);
  const pathCategory = normalizeProductPathCategory(categoryParam);
  const canonicalPath = productHref(productRaw);
  // Wrong / alias category → metadata still points at canonical URL.
  if (pathCategory !== canonicalCategory || productRaw.slug !== slugParam) {
    const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return {
      title: productRaw.name,
      alternates: {
        canonical: `${pathPrefix}${canonicalPath}`,
        languages: storefrontHreflangLanguages(canonicalPath),
      },
    };
  }

  const messages = await getMessages({ locale });
  const product = applyStorefrontProductLocale(productRaw, locale, messages);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const pageUrl = `${getSiteUrl()}${pathPrefix}${canonicalPath}`;
  const og = absoluteOgImageUrl(product.image);
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: {
      canonical: `${pathPrefix}${canonicalPath}`,
      languages: storefrontHreflangLanguages(canonicalPath),
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: product.name,
      description: product.shortDescription,
      siteName: "HUMPBUCK",
      images: [{ url: og, width: 1200, height: 1200, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
      images: [og],
    },
  };
}

async function ProductPdpResolvedBody({
  locale,
  categoryParam,
  slugParam,
}: {
  locale: string;
  categoryParam: string;
  slugParam: string;
}) {
  const productRaw = await resolveProductForPdpSlug(slugParam);
  if (!productRaw) notFound();

  const canonicalCategory = productPathCategoryFromProduct(productRaw);
  const pathCategory = normalizeProductPathCategory(categoryParam);
  const canonicalPath = productHref(productRaw);

  // Unknown category segment, wrong category, or legacy model slug → 308 canonical.
  if (
    !pathCategory ||
    pathCategory !== canonicalCategory ||
    productRaw.slug !== slugParam ||
    !(PRODUCT_PATH_CATEGORIES as readonly string[]).includes(categoryParam)
  ) {
    await permanentRedirectWithLocale(canonicalPath);
  }

  const t = await getTranslations("Product");
  const messages = await getMessages({ locale });
  const product = applyStorefrontProductLocale(productRaw, locale, messages);
  const slug = product.slug;

  return (
    <div>
      <ProductPdpScrollTop />
      <SilentErrorBoundary name="product-json-ld">
        <ProductJsonLd locale={locale} slug={slug} product={product} />
      </SilentErrorBoundary>
      <div className="mx-auto min-w-0 max-w-7xl py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14">
        <Link
          href="/watches"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          {t("backToShop")}
        </Link>

        <Suspense fallback={<ProductPdpMainFallback />}>
          <ProductPdpMainAsyncSection locale={locale} slug={slug} />
        </Suspense>

        <Suspense fallback={<ProductPdpReviewsFallback />}>
          <ProductReviewsSection productSlug={slug} productName={product.name} />
        </Suspense>
      </div>

      <Suspense fallback={<ProductPdpRelatedFallback />}>
        <ProductPdpRelatedAsyncSection locale={locale} slug={slug} />
      </Suspense>
    </div>
  );
}

function ProductPdpPageFallback() {
  return (
    <div>
      <div className="mx-auto min-w-0 max-w-7xl py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14">
        <div className="h-4 w-28 animate-pulse rounded bg-ink/[0.08]" aria-hidden />
        <ProductPdpMainFallback />
        <ProductPdpReviewsFallback />
      </div>
      <ProductPdpRelatedFallback />
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category: categoryParam, slug: slugParam } = await params;
  setRequestLocale(locale);

  // Return shell immediately; catalog resolve + redirect stay inside Suspense.
  return (
    <Suspense fallback={<ProductPdpPageFallback />}>
      <ProductPdpResolvedBody
        locale={locale}
        categoryParam={categoryParam}
        slugParam={slugParam}
      />
    </Suspense>
  );
}
