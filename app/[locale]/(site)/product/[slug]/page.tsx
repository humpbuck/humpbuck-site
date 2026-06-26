import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import {
  getMergedCatalogProductBySlug,
  getMergedCatalogProducts,
} from "@/lib/catalog-db";
import { absoluteOgImageUrl, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { routing } from "@/i18n/routing";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { ProductReviewsSection } from "@/components/site/ProductReviewsSection";
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
  const products = await getMergedCatalogProducts();
  return routing.locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Product" });
  const productRaw = await getMergedCatalogProductBySlug(slug);
  if (!productRaw) return { title: t("metaFallbackTitle") };
  const messages = await getMessages({ locale });
  const product = applyStorefrontProductLocale(productRaw, locale, messages);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const pageUrl = `${getSiteUrl()}${pathPrefix}/product/${encodeURIComponent(slug)}`;
  const og = absoluteOgImageUrl(product.image);
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: {
      canonical: `${pathPrefix}/product/${encodeURIComponent(slug)}`,
      languages: storefrontHreflangLanguages(`/product/${encodeURIComponent(slug)}`),
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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Product");
  const messages = await getMessages({ locale });
  const productRaw = await getMergedCatalogProductBySlug(slug);
  if (!productRaw) notFound();
  const product = applyStorefrontProductLocale(productRaw, locale, messages);

  return (
    <div>
      <div className="mx-auto min-w-0 max-w-7xl py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14">
        <Link
          href="/product"
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
