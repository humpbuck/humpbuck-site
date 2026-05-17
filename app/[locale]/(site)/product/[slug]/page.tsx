import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Check } from "lucide-react";
import { formatPrice, getSeriesBySlug } from "@/lib/catalog";
import {
  getMergedCatalogProductBySlug,
  getMergedCatalogProducts,
} from "@/lib/catalog-db";
import { absoluteOgImageUrl, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { routing } from "@/i18n/routing";
import { applyStorefrontProductLocale, getLocalizedSeriesFields } from "@/lib/storefront-locale";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDetailImageStrip } from "@/components/site/ProductDetailImageStrip";
import { ProductPdpMediaColumn } from "@/components/site/ProductPdpMediaColumn";
import { ProductReviewsSection } from "@/components/site/ProductReviewsSection";
import { TrackProductView } from "@/components/analytics/track-product-view";
import { ProductDetailClient } from "@/components/site/ProductDetailClient";

/** Fresh buyer reviews + R2 gallery discovery on each request (avoid stale static PDP). */
export const dynamic = "force-dynamic";

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

  const series = getSeriesBySlug(product.seriesSlug);
  const localizedSeries = series
    ? getLocalizedSeriesFields(series, locale, messages)
    : null;
  const all = await getMergedCatalogProducts();
  const related = all
    .filter((p) => p.slug !== product.slug && p.seriesSlug === product.seriesSlug)
    .map((p) => applyStorefrontProductLocale(p, locale, messages))
    .slice(0, 3);

  const gallerySlides = product.galleryImages ?? product.images ?? (product.image ? [product.image] : []);
  const detailImages = product.detailImages ?? [];
  const firstSlide =
    gallerySlides[0] ??
    product.galleryImages?.[0] ??
    product.images[0] ??
    product.promoVideo?.poster;
  const preferredPromoVideo = product.promoVideo;
  const promoVideosForMedia: { src: string; poster?: string }[] | null =
    preferredPromoVideo
      ? [
          {
            src: preferredPromoVideo.src,
            poster: firstSlide ?? preferredPromoVideo.poster,
          },
        ]
      : null;

  return (
    <div>
      <TrackProductView slug={product.slug} />
      <div className="mx-auto min-w-0 max-w-7xl py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:py-14">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          {t("backToShop")}
        </Link>

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-x-14 lg:gap-y-10">
          <ProductPdpMediaColumn
            productName={product.name}
            gallerySlides={gallerySlides}
            themeGlowClass={
              series?.theme === "digital"
                ? "from-cyan-500/15 to-transparent"
                : series?.theme === "luxe"
                  ? "from-[color:var(--color-luxe)]/15 to-transparent"
                  : "from-violet-500/10 to-transparent"
            }
            promoVideos={promoVideosForMedia ?? undefined}
          />

          <div className="flex min-h-0 min-w-0 flex-col lg:h-full lg:min-h-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {product.categoryLabel}
            </div>
            {series && localizedSeries && (
              <Link
                href={`/series/${series.slug}`}
                className="mt-2 inline-block text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/65 hover:text-ink hover:underline"
              >
                {localizedSeries.name}
              </Link>
            )}
            <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {product.shortDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <div className="text-3xl font-semibold tabular-nums">
                {formatPrice(product.price)}
              </div>
              {product.compareAtPrice != null && (
                <div className="text-lg text-muted line-through tabular-nums">
                  {formatPrice(product.compareAtPrice)}
                </div>
              )}
            </div>

            <ProductDetailClient
              slug={product.slug}
              name={product.name}
              price={product.price}
              inStock={product.inStock}
              variantOptions={product.variantOptions ?? []}
            />

            {product.highlights.length > 0 && (
              <div className="mt-10 space-y-3">
                {product.highlights.map((h) => (
                  <div key={h} className="flex gap-3 text-sm text-ink/85">
                    <Check
                      className="mt-0.5 shrink-0 text-digital-dim"
                      size={18}
                      strokeWidth={2}
                    />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {(product.description || product.specs.length > 0) && (
              <div className="mt-10 rounded-2xl border border-line bg-white/60 p-6">
                <h2 className="font-serif text-xl">{t("detailsHeading")}</h2>
                {product.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {product.description}
                  </p>
                )}
                {product.specs.length > 0 && (
                  <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                    {product.specs.map((row, idx) => (
                      <div
                        key={`${row.label || row.value || "spec"}-${idx}`}
                        className="rounded-xl border border-line bg-paper px-4 py-3"
                      >
                        {row.label && (
                          <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">
                            {row.label}
                          </dt>
                        )}
                        {row.value && (
                          <dd className="mt-1 text-sm font-medium">{row.value}</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-4 pt-8 text-[12px] text-muted">
              <Link href="/shipping" className="underline-offset-4 hover:underline">
                {t("shippingTax")}
              </Link>
              <span className="text-[color:var(--color-line)]">·</span>
              <Link href="/refund" className="underline-offset-4 hover:underline">
                {t("refunds")}
              </Link>
            </div>
          </div>
        </div>

        {detailImages.length > 0 && (
          <section className="mt-16 border-t border-line pt-14">
            <h2 className="font-serif text-2xl tracking-tight">{t("closerLookTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {t("closerLookBody", { name: product.name })}
            </p>
            <ProductDetailImageStrip
              productName={product.name}
              imageUrls={detailImages}
            />
          </section>
        )}

        <ProductReviewsSection
          productSlug={product.slug}
          productName={product.name}
        />
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-paper py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-serif text-2xl">{t("youMayAlsoLike")}</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
              {related.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  cardImageUrl={undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
