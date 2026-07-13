import type { Product } from "@/lib/catalog";
import {
  reviewAuthorShortLabel,
  type ProductReviewWithUser,
} from "@/lib/product-reviews-queries";
import { routing } from "@/i18n/routing";
import { absoluteOgImageUrl, getSiteUrl } from "@/lib/seo";

export type ProductReviewStats = {
  reviewCount: number;
  ratingValue: number;
};

function productPageUrl(locale: string, slug: string): string {
  const base = getSiteUrl();
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${base}${pathPrefix}/product/${encodeURIComponent(slug)}`;
}

function productImages(product: Product): string[] {
  const raw = [product.image, ...(product.galleryImages ?? product.images ?? [])].filter(
    (src) => typeof src === "string" && src.trim().length > 0,
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of raw) {
    const url = absoluteOgImageUrl(src);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 8) break;
  }
  return out.length > 0 ? out : [absoluteOgImageUrl(undefined)];
}

/** Schema.org Product JSON-LD for PDP rich results (price, availability, ratings). */
export function buildProductJsonLd(params: {
  locale: string;
  slug: string;
  product: Product;
  stats: ProductReviewStats | null;
  reviews: ProductReviewWithUser[];
}): Record<string, unknown> {
  const { locale, slug, product, stats, reviews } = params;
  const siteUrl = getSiteUrl();
  const pageUrl = productPageUrl(locale, slug);
  const images = productImages(product);
  const description =
    product.shortDescription.trim() || product.description.trim() || product.name.trim();

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    url: pageUrl,
    name: product.name,
    description,
    image: images.length === 1 ? images[0] : images,
    sku: slug,
    brand: { "@type": "Brand", name: "HUMPBUCK" },
    manufacturer: { "@id": `${siteUrl}/#organization` },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteUrl}/#organization` },
    },
  };

  if (stats && stats.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.ratingValue,
      reviewCount: stats.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const visibleReviews = reviews
    .filter((r) => r.body.trim().length > 0)
    .slice(0, 5);
  if (visibleReviews.length > 0) {
    data.review = visibleReviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: reviewAuthorShortLabel(r),
      },
      datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.body.trim(),
    }));
  }

  return data;
}
