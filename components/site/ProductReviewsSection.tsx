import { ProductReviewsBuyerUi } from "@/components/site/product-reviews-buyer-ui";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getProductReviewsWithUsers,
  parseReviewImageUrls,
  reviewAuthorShortLabel,
} from "@/lib/product-reviews-queries";
import { intlLocaleFromAppLocale } from "@/lib/site-locale";

/** Static PDP reviews — auth and buyer-specific UI load client-side only. */
export async function ProductReviewsSection({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  let rows: Awaited<ReturnType<typeof getProductReviewsWithUsers>> = [];
  let reviewsLoadError = false;
  try {
    rows = await getProductReviewsWithUsers(productSlug, 100);
  } catch (err) {
    reviewsLoadError = true;
    console.error("[ProductReviewsSection] failed to load reviews", err);
  }

  const locale = await getLocale();
  const intlTag = intlLocaleFromAppLocale(locale);
  const t = await getTranslations("Reviews");

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  };

  const reviewCards = rows.map((r) => ({
    id: r.id,
    author: reviewAuthorShortLabel(r),
    when: new Date(r.createdAt).toLocaleDateString(intlTag, dateOptions),
    rating: r.rating,
    body: r.body,
    imageUrls: parseReviewImageUrls(r.imageUrlsJson),
    itemVariantLabel: r.itemVariantLabel ?? null,
    verified: Boolean(r.orderId),
    merchantReply: r.merchantReply,
    merchantRepliedAt: r.merchantRepliedAt
      ? new Date(r.merchantRepliedAt).toLocaleDateString(intlTag, dateOptions)
      : null,
    appends: r.appends.map((a) => ({
      id: a.id,
      when: new Date(a.createdAt).toLocaleDateString(intlTag, dateOptions),
      body: a.body,
      imageUrls: parseReviewImageUrls(a.imageUrlsJson),
    })),
  }));

  return (
    <section id="buyer-reviews" className="mt-16 border-t border-line pt-14 scroll-mt-28">
      <h2 className="font-serif text-2xl tracking-tight">{t("title")}</h2>

      {reviewsLoadError ? (
        <p className="mt-8 text-sm text-amber-800">{t("loadError")}</p>
      ) : (
        <ProductReviewsBuyerUi
          productSlug={productSlug}
          productName={productName}
          reviews={reviewCards}
        />
      )}

      {!reviewsLoadError && rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t("empty")}</p>
      ) : null}
    </section>
  );
}
