import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";
import { ReviewerAvatar } from "@/components/site/ReviewerAvatar";
import { PdpReviewWriteCta } from "@/components/site/pdp-review-write-cta";
import { MAX_REVIEW_APPENDS } from "@/lib/review-append-constants";
import {
  getProductReviewsWithUsers,
  parseReviewImageUrls,
  reviewAuthorLabel,
} from "@/lib/product-reviews-queries";
import { getReviewAvatarDisplayUrl } from "@/lib/avatar-resolve";
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
    rows = await getProductReviewsWithUsers(productSlug, 50);
  } catch (err) {
    reviewsLoadError = true;
    console.error("[ProductReviewsSection] failed to load reviews", err);
  }

  const locale = await getLocale();
  const intlTag = intlLocaleFromAppLocale(locale);
  const t = await getTranslations("Reviews");

  return (
    <section className="mt-16 border-t border-line pt-14">
      <h2 className="font-serif text-2xl tracking-tight">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {t.rich("intro", {
          orderHistory: (chunks) => (
            <Link
              href="/account/orders"
              className="font-semibold text-ink underline-offset-4 hover:underline"
            >
              {chunks}
            </Link>
          ),
          strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
        })}
      </p>
      <div className="mt-3">
        <PdpReviewWriteCta
          productSlug={productSlug}
          userId={session?.user?.id}
        />
      </div>

      {reviewsLoadError ? (
        <p className="mt-8 text-sm text-amber-800">{t("loadError")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-8">
          {rows.map((r) => {
            const when = new Date(r.createdAt).toLocaleString(intlTag, {
              dateStyle: "medium",
              timeStyle: "short",
            });
            const imgs = parseReviewImageUrls(r.imageUrlsJson);
            const author = reviewAuthorLabel(r);
            const avatarSrc = getReviewAvatarDisplayUrl({
              image: r.user.image,
              email: r.user.email,
            });
            const isOwn = session?.user?.id === r.user.id;
            const canAppend = isOwn && r.appends.length < MAX_REVIEW_APPENDS;

            return (
              <li
                key={r.id}
                className="rounded-2xl border border-line bg-paper/80 p-5"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <ReviewerAvatar src={avatarSrc} label={author} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-semibold text-ink">{author}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                        {t("verifiedPurchase")}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-amber-600 tabular-nums" aria-hidden>
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </span>
                      <span className="text-xs text-muted tabular-nums">{when}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">
                      {r.body}
                    </p>
                    {imgs.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {imgs.map((src) => (
                          <a
                            key={src}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-[color:var(--color-line)]"
                          >
                            <Image
                              src={src}
                              alt={t("reviewPhotoAlt", { name: productName })}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {r.merchantReply ? (
                      <div className="mt-4 rounded-xl border border-line bg-ink/[0.03] px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                          {t("storeResponse")}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink/90">
                          {r.merchantReply}
                        </p>
                        {r.merchantRepliedAt ? (
                          <p className="mt-1 text-xs text-muted">
                            {new Date(r.merchantRepliedAt).toLocaleString(intlTag, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {r.appends.map((a) => {
                      const aWhen = new Date(a.createdAt).toLocaleString(intlTag, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      });
                      const aImgs = parseReviewImageUrls(a.imageUrlsJson);
                      return (
                        <div
                          key={a.id}
                          className="mt-4 border-l-2 border-ink/15 pl-4"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                            {t("followUp", { when: aWhen })}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-ink/90">
                            {a.body}
                          </p>
                          {aImgs.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {aImgs.map((src) => (
                                <a
                                  key={src}
                                  href={src}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-[color:var(--color-line)]"
                                >
                                  <Image
                                    src={src}
                                    alt={t("followUpPhotoAlt", { name: productName })}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    {canAppend ? (
                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em]">
                        <Link
                          href={`/account/reviews/${r.id}/append`}
                          className="text-ink underline-offset-4 hover:underline"
                        >
                          {t("addFollowUp")}
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
