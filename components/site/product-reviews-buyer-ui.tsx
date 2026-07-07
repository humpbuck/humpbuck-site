"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ProductReviewForm } from "@/components/account/product-review-form";
import {
  ProductReviewsMasonry,
  type ProductReviewCardModel,
} from "@/components/site/product-reviews-masonry";
import type { PdpReviewFormAccess } from "@/lib/pdp-review-form-access";

type ReviewAccessPayload = {
  access: PdpReviewFormAccess["kind"];
  orderId: string | null;
  appendableReviewIds: string[];
};

type ReviewCardBase = Omit<ProductReviewCardModel, "canAppend">;

export function ProductReviewsBuyerUi({
  productSlug,
  productName,
  reviews,
}: {
  productSlug: string;
  productName: string;
  reviews: ReviewCardBase[];
}) {
  const { status } = useSession();
  const t = useTranslations("Reviews");
  const [payload, setPayload] = useState<ReviewAccessPayload>({
    access: "guest",
    orderId: null,
    appendableReviewIds: [],
  });
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setPayload({ access: "guest", orderId: null, appendableReviewIds: [] });
      setLoadingAccess(false);
      return;
    }

    let cancelled = false;
    setLoadingAccess(true);
    void fetch(`/api/account/review-cta?productSlug=${encodeURIComponent(productSlug)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReviewAccessPayload | null) => {
        if (cancelled) return;
        setPayload(
          data?.access
            ? {
                access: data.access,
                orderId: data.orderId ?? null,
                appendableReviewIds: Array.isArray(data.appendableReviewIds)
                  ? data.appendableReviewIds.filter((id): id is string => typeof id === "string")
                  : [],
              }
            : { access: "guest", orderId: null, appendableReviewIds: [] },
        );
      })
      .catch(() => {
        if (!cancelled) setPayload({ access: "guest", orderId: null, appendableReviewIds: [] });
      })
      .finally(() => {
        if (!cancelled) setLoadingAccess(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productSlug, status]);

  const appendable = useMemo(() => new Set(payload.appendableReviewIds), [payload.appendableReviewIds]);
  const reviewCards = useMemo(
    () =>
      reviews.map((review) => ({
        ...review,
        canAppend: appendable.has(review.id),
      })),
    [appendable, reviews],
  );

  return (
    <>
      {loadingAccess ? (
        <div className="mt-6 h-24 max-w-xl rounded-2xl border border-line/70 bg-white/40" aria-hidden />
      ) : payload.access === "confirmReceiptRequired" ? (
        <div className="mt-6 max-w-xl rounded-2xl border border-line bg-white/60 p-6">
          <p className="text-sm text-muted">{t("confirmReceiptRequiredHint")}</p>
        </div>
      ) : payload.access === "alreadyReviewed" ? (
        <p className="mt-3 text-sm text-muted">{t("reviewAlreadySubmitted")}</p>
      ) : payload.access === "guest" ||
        payload.access === "signedInNoPurchase" ||
        payload.access === "eligible" ? (
        <div className="mt-6 max-w-xl rounded-2xl border border-line bg-white/60 p-6">
          {payload.access === "signedInNoPurchase" ? (
            <p className="mb-4 text-sm text-muted">{t("purchaseRequiredHint")}</p>
          ) : null}
          <ProductReviewForm
            embedded
            productSlug={productSlug}
            productName={productName}
            cancelHref={`/product/${productSlug}`}
            orderId={payload.access === "eligible" ? payload.orderId ?? undefined : undefined}
          />
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="mt-8">
          <ProductReviewsMasonry reviews={reviewCards} productName={productName} />
        </div>
      ) : null}
    </>
  );
}
