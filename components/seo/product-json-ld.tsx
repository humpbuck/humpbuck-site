import type { Product } from "@/lib/catalog";
import { buildProductJsonLd } from "@/lib/product-json-ld";
import {
  getProductReviewStats,
  getProductReviewsWithUsers,
} from "@/lib/product-reviews-queries";

type Props = {
  locale: string;
  slug: string;
  product: Product;
};

/** Product + Offer + aggregateRating JSON-LD on PDP (complements site-wide Organization schema). */
export async function ProductJsonLd({ locale, slug, product }: Props) {
  let stats: Awaited<ReturnType<typeof getProductReviewStats>> = null;
  let reviews: Awaited<ReturnType<typeof getProductReviewsWithUsers>> = [];

  try {
    [stats, reviews] = await Promise.all([
      getProductReviewStats(slug),
      getProductReviewsWithUsers(slug, 5),
    ]);
  } catch (err) {
    console.error("[ProductJsonLd] failed to load review data", err);
  }

  const data = buildProductJsonLd({ locale, slug, product, stats, reviews });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
