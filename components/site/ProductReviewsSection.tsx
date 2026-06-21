import { ProductReviewForm } from "@/components/account/product-review-form";
import { ProductReviewsMasonry } from "@/components/site/product-reviews-masonry";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";
import { MAX_REVIEW_APPENDS } from "@/lib/review-append-constants";
import { getPdpReviewFormAccess } from "@/lib/pdp-review-form-access";
import {
  getProductReviewsWithUsers,
  parseReviewImageUrls,
  reviewAuthorShortLabel,
} from "@/lib/product-reviews-queries";
import { intlLocaleFromAppLocale } from "@/lib/site-locale";

export async function ProductReviewsSection({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  let session: Session | null = null;
  let rows: Awaited<ReturnType<typeof getProductReviewsWithUsers>> = [];
  let reviewsLoadError = false;
  try {
    session = (await auth()) as Session | null;
    rows = await getProductReviewsWithUsers(productSlug, 100);
  } catch (err) {
    reviewsLoadError = true;
    console.error("[ProductReviewsSection] failed to load reviews", err);
  }

  const locale = await getLocale();
  const intlTag = intlLocaleFromAppLocale(locale);
  const t = await getTranslations("Reviews");

  let formAccess: Awaited<ReturnType<typeof getPdpReviewFormAccess>> = { kind: "guest" };
  try {
    formAccess = await getPdpReviewFormAccess(session?.user?.id, productSlug);
  } catch (err) {
    console.error("[ProductReviewsSection] form access failed", err);
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  };

  const reviewCards = rows.map((r) => {
    const isOwn = session?.user?.id != null && session.user.id === r.user?.id;
    return {
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
      canAppend: isOwn && r.appends.length < MAX_REVIEW_APPENDS,
    };
  });

  return (
    <section id="buyer-reviews" className="mt-16 border-t border-line pt-14 scroll-mt-28">
      <h2 className="font-serif text-2xl tracking-tight">{t("title")}</h2>

      {formAccess.kind === "confirmReceiptRequired" ? (
        <div className="mt-6 max-w-xl rounded-2xl border border-line bg-white/60 p-6">
          <p className="text-sm text-muted">{t("confirmReceiptRequiredHint")}</p>
        </div>
      ) : formAccess.kind !== "alreadyReviewed" ? (
        <div className="mt-6 max-w-xl rounded-2xl border border-line bg-white/60 p-6">
          {formAccess.kind === "signedInNoPurchase" ? (
            <p className="mb-4 text-sm text-muted">{t("purchaseRequiredHint")}</p>
          ) : null}
          <ProductReviewForm
            embedded
            productSlug={productSlug}
            productName={productName}
            cancelHref={`/product/${productSlug}`}
            orderId={formAccess.kind === "eligible" ? formAccess.orderId : undefined}
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("reviewAlreadySubmitted")}</p>
      )}

      {reviewsLoadError ? (
        <p className="mt-8 text-sm text-amber-800">{t("loadError")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t("empty")}</p>
      ) : (
        <div className="mt-8">
          <ProductReviewsMasonry reviews={reviewCards} productName={productName} />
        </div>
      )}
    </section>
  );
}
