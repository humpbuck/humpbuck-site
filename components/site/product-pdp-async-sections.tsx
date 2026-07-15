import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Check, ChevronDown } from "lucide-react";
import { HomeFaqAnswerBody } from "@/components/site/home-faq-answer-body";
import {
  normalizeSeriesSlug,
  resolveSeriesInfo,
} from "@/lib/catalog";
import { DisplayPrice } from "@/components/site/DisplayPrice";
import {
  getMergedCatalogProductBySlug,
  getMergedCatalogProducts,
} from "@/lib/catalog-db";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductCloserLookSection } from "@/components/site/product-closer-look-section";
import { PreloadPdpGalleryImages } from "@/components/site/preload-pdp-gallery-images";
import { ProductPdpMediaColumn } from "@/components/site/ProductPdpMediaColumn";
import { ProductFiveStarRating } from "@/components/site/product-five-star-rating";
import { getProductFiveStarReviewCounts } from "@/lib/product-reviews-queries";
import { ProductDetailClient } from "@/components/site/ProductDetailClient";
import { ProductPdpGallerySyncProvider } from "@/components/site/product-pdp-gallery-sync";
import { resolvePdpCloserLookBlocks, resolveStorefrontProductMedia } from "@/lib/r2-pdp-media";
import { mapProductsToShopCardImages } from "@/lib/r2-card-image";
import { resolveHomeFaqItems } from "@/lib/site-home-content";
import { getSiteHomeContent } from "@/lib/site-home-content-queries";

const PDP_POLICY_LINK_CLASS =
  "block text-[12px] text-muted underline-offset-4 hover:underline";

export async function ProductPdpMainAsyncSection({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  setRequestLocale(locale);
  const [t, tHome, messages, productRaw, homeContent] = await Promise.all([
    getTranslations("Product"),
    getTranslations("Home"),
    getMessages({ locale }),
    getMergedCatalogProductBySlug(slug),
    getSiteHomeContent(),
  ]);
  if (!productRaw) notFound();
  const product = applyStorefrontProductLocale(productRaw, locale, messages);

  const faqItems = resolveHomeFaqItems(
    homeContent,
    [
      {
        question: tHome("certaintyCurrencyTitle"),
        answer: tHome("certaintyCurrencyBody"),
      },
      {
        question: tHome("certaintyShippingTitle"),
        answer: tHome("certaintyShippingBody"),
      },
      {
        question: tHome("certaintyPaymentsTitle"),
        answer: tHome("certaintyPaymentsBody"),
      },
      {
        question: tHome("certaintyOrderTitle"),
        answer: tHome("certaintyOrderBody"),
      },
    ],
    locale,
  );

  const series = product.seriesSlug.trim()
    ? resolveSeriesInfo(product.seriesSlug, { heroImage: product.image })
    : null;

  const [media, closerLookBlocks, fiveStarCountsMap] = await Promise.all([
    resolveStorefrontProductMedia({
      slug: product.slug,
      image: product.image,
      gallery: product.galleryImages ?? product.images,
      detail: product.detailImages,
      detailBlocks: product.detailBlocks,
      variants: product.variantOptions,
      promoVideo: product.promoVideo,
    }),
    resolvePdpCloserLookBlocks(product.slug, product.detailBlocks),
    getProductFiveStarReviewCounts([product.slug]),
  ]);

  const { gallery: gallerySlides, variantOptions, promoVideos } = media;
  const fiveStarReviewCount = fiveStarCountsMap.get(product.slug) ?? 0;

  return (
    <>
      {gallerySlides.length > 0 ? <PreloadPdpGalleryImages urls={gallerySlides} /> : null}
      <ProductPdpGallerySyncProvider
        gallerySlides={gallerySlides}
        variantOptions={variantOptions}
      >
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
            promoVideos={promoVideos ?? undefined}
          />

          <div className="flex min-h-0 min-w-0 flex-col lg:h-full lg:min-h-0">
            {product.categoryLabel.trim() && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {product.categoryLabel}
              </div>
            )}
            <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <ProductFiveStarRating count={fiveStarReviewCount} className="mt-2" />
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted">
              {product.shortDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <DisplayPrice
                usd={product.price}
                className="text-3xl font-semibold"
                referenceClassName="text-sm text-muted"
              />
              {product.compareAtPrice != null && (
                <DisplayPrice
                  usd={product.compareAtPrice}
                  hideReference
                  primaryClassName="text-lg text-muted line-through tabular-nums"
                />
              )}
            </div>

            <ProductDetailClient
              slug={product.slug}
              name={product.name}
              price={product.price}
              inStock={product.inStock}
              variantOptions={variantOptions}
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
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
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

            <div className="mt-auto space-y-3 pt-8">
              {faqItems.map((item, index) => (
                <details key={`pdp-faq-${index}`} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] text-muted marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <ChevronDown
                      size={14}
                      strokeWidth={1.75}
                      className="shrink-0 text-muted transition duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="mt-2 text-[12px] leading-relaxed text-muted">
                    <HomeFaqAnswerBody text={item.answer} />
                  </div>
                </details>
              ))}
              <Link href="/shipping" className={PDP_POLICY_LINK_CLASS}>
                {t("shippingTax")}
              </Link>
              <Link href="/refund" className={PDP_POLICY_LINK_CLASS}>
                {t("refunds")}
              </Link>
            </div>
          </div>
        </div>
      </ProductPdpGallerySyncProvider>

      <ProductCloserLookSection
        productName={product.name}
        sectionTitle={t("closerLookTitle")}
        sectionIntro={t("closerLookBody", { name: product.name })}
        blocks={closerLookBlocks}
      />
    </>
  );
}

export async function ProductPdpRelatedAsyncSection({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Product");
  const messages = await getMessages({ locale });
  const productRaw = await getMergedCatalogProductBySlug(slug);
  if (!productRaw) return null;
  const product = applyStorefrontProductLocale(productRaw, locale, messages);

  const all = await getMergedCatalogProducts();
  const related = all
    .filter(
      (p) =>
        p.slug !== product.slug &&
        normalizeSeriesSlug(p.seriesSlug) === normalizeSeriesSlug(product.seriesSlug),
    )
    .map((p) => applyStorefrontProductLocale(p, locale, messages))
    .slice(0, 3);

  if (related.length === 0) return null;

  const [{ covers: relatedCardImages, hovers: relatedCardHoverImages }] = await Promise.all([
    mapProductsToShopCardImages(related),
  ]);

  return (
    <section className="border-t border-line bg-paper py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-serif text-2xl">{t("youMayAlsoLike")}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {related.map((p, i) => (
            <ProductCard
              key={p.slug}
              product={p}
              cardImageUrl={relatedCardImages[i] ?? undefined}
              cardHoverImageUrl={relatedCardHoverImages[i] ?? undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
