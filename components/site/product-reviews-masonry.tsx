"use client";

import { useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";

const INITIAL_VISIBLE = 15;
const LOAD_MORE_STEP = 30;

export type ProductReviewCardModel = {
  id: string;
  author: string;
  when: string;
  rating: number;
  body: string;
  imageUrls: string[];
  itemVariantLabel: string | null;
  verified: boolean;
  merchantReply: string | null;
  merchantRepliedAt: string | null;
  appends: Array<{
    id: string;
    when: string;
    body: string;
    imageUrls: string[];
  }>;
  canAppend: boolean;
};

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="text-[11px] leading-none tabular-nums" aria-hidden>
      <span className="text-amber-500">{"★".repeat(rating)}</span>
      <span className="text-muted/35">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ProductReviewsMasonry({
  reviews,
  productName,
}: {
  reviews: ProductReviewCardModel[];
  productName: string;
}) {
  const t = useTranslations("Reviews");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visible = useMemo(() => reviews.slice(0, visibleCount), [reviews, visibleCount]);
  const hasMore = visibleCount < reviews.length;

  return (
    <div>
      <ul className="columns-2 gap-3 sm:columns-3 md:columns-4 xl:columns-5 [&>li]:mb-3 [&>li]:break-inside-avoid">
        {visible.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-line/80 bg-white px-3 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold leading-tight text-ink">{r.author}</span>
              {r.verified ? (
                <BadgeCheck
                  className="h-3.5 w-3.5 shrink-0 text-ink"
                  aria-label={t("verifiedPurchase")}
                />
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] tabular-nums text-muted">{r.when}</p>
            <div className="mt-1.5">
              <ReviewStars rating={r.rating} />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-snug text-ink/90">{r.body}</p>

            {r.imageUrls.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.imageUrls.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-[color:var(--color-line)]"
                  >
                    <StorefrontImage
                      src={src}
                      alt={t("reviewPhotoAlt", { name: productName })}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </a>
                ))}
              </div>
            ) : null}

            {r.itemVariantLabel ? (
              <p className="mt-2 text-[11px] text-muted">
                {t("itemType")}{" "}
                <span className="text-ink/70">{r.itemVariantLabel}</span>
              </p>
            ) : null}

            {r.merchantReply ? (
              <div className="mt-2 rounded-md border border-line/70 bg-ink/[0.02] px-2.5 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t("storeResponse")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[12px] leading-snug text-ink/85">
                  {r.merchantReply}
                </p>
                {r.merchantRepliedAt ? (
                  <p className="mt-0.5 text-[10px] text-muted">{r.merchantRepliedAt}</p>
                ) : null}
              </div>
            ) : null}

            {r.appends.map((a) => (
              <div key={a.id} className="mt-2 border-l border-ink/15 pl-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t("followUp", { when: a.when })}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[12px] leading-snug text-ink/85">
                  {a.body}
                </p>
                {a.imageUrls.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {a.imageUrls.map((src) => (
                      <a
                        key={src}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-[color:var(--color-line)]"
                      >
                        <StorefrontImage
                          src={src}
                          alt={t("followUpPhotoAlt", { name: productName })}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {r.canAppend ? (
              <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em]">
                <Link
                  href={`/account/reviews/${r.id}/append`}
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {t("addFollowUp")}
                </Link>
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, reviews.length))}
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition hover:border-ink/25"
          >
            {t("showMore", { count: reviews.length - visibleCount })}
          </button>
        </div>
      ) : null}
    </div>
  );
}
