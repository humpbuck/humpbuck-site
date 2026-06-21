"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ProductReviewForm } from "@/components/account/product-review-form";
import { CenterModal } from "@/components/ui/center-modal";
import { orderStatusAllowsReview } from "@/lib/review-eligibility";

type ReviewLine = {
  slug: string;
  name: string;
};

export function BuyerOrderDetailActions({
  orderId,
  orderStatus,
  lines,
  reviewedProductSlugs,
}: {
  orderId: string;
  orderStatus: string;
  lines: ReviewLine[];
  reviewedProductSlugs: string[];
}) {
  const router = useRouter();
  const tConfirm = useTranslations("AccountConfirm");
  const tAccount = useTranslations("Account");
  const tReviews = useTranslations("Reviews");
  const tReview = useTranslations("AccountReview");

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFirstOpen, setConfirmFirstOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState("");

  const unreviewedLines = useMemo(
    () =>
      lines.filter(
        (line, index, all) =>
          !reviewedProductSlugs.includes(line.slug) &&
          all.findIndex((l) => l.slug === line.slug) === index,
      ),
    [lines, reviewedProductSlugs],
  );

  const showConfirm = orderStatus === "shipped";
  const canWriteReview = orderStatusAllowsReview(orderStatus);
  const showReview =
    unreviewedLines.length > 0 &&
    (orderStatus === "shipped" || canWriteReview);

  const activeLine =
    unreviewedLines.find((l) => l.slug === activeSlug) ?? unreviewedLines[0];

  if (!showConfirm && !showReview) return null;

  async function onConfirmReceived() {
    setConfirmLoading(true);
    setConfirmErr(null);
    setConfirmMsg(null);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/confirm-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || tConfirm("errorGeneric"));
      }
      setConfirmMsg(tConfirm("success"));
      router.refresh();
    } catch (e) {
      setConfirmErr(e instanceof Error ? e.message : tConfirm("errorGeneric"));
    } finally {
      setConfirmLoading(false);
    }
  }

  function openReview() {
    if (!canWriteReview) {
      setConfirmFirstOpen(true);
      return;
    }
    if (unreviewedLines.length === 0) return;
    setActiveSlug(unreviewedLines[0]!.slug);
    setReviewOpen(true);
  }

  function closeReviewModal() {
    setReviewOpen(false);
    setActiveSlug("");
  }

  function onReviewSuccess() {
    closeReviewModal();
    router.replace(`/account/orders/${orderId}`);
  }

  const actionButtonClass =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50";

  return (
    <>
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        {showConfirm ? (
          <p className="text-sm text-emerald-950">{tConfirm("prompt")}</p>
        ) : (
          <p className="text-sm text-emerald-950">{tAccount("detailReviewPrompt")}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          {showConfirm ? (
            <button
              type="button"
              onClick={onConfirmReceived}
              disabled={confirmLoading}
              className={`${actionButtonClass} bg-emerald-800 text-white hover:bg-emerald-900`}
            >
              {confirmLoading ? tConfirm("confirming") : tConfirm("button")}
            </button>
          ) : null}
          {showReview ? (
            <button
              type="button"
              onClick={openReview}
              className={`${actionButtonClass} border border-emerald-800 bg-white text-emerald-900 hover:bg-emerald-100/80`}
            >
              {tAccount("detailReviewButton")}
            </button>
          ) : null}
        </div>
        {confirmMsg ? <p className="mt-2 text-xs text-emerald-900">{confirmMsg}</p> : null}
        {confirmErr ? <p className="mt-2 text-xs text-rose-700">{confirmErr}</p> : null}
      </div>

      {confirmFirstOpen ? (
        <CenterModal
          title={tAccount("detailReviewConfirmFirstTitle")}
          onClose={() => setConfirmFirstOpen(false)}
        >
          <p className="text-sm leading-relaxed text-ink/90">
            {tAccount("detailReviewConfirmFirstBody")}
          </p>
        </CenterModal>
      ) : null}

      {reviewOpen && activeLine ? (
        <CenterModal title={tReview("writeKicker")} onClose={closeReviewModal} size="wide">
          <div className="max-w-xl rounded-2xl border border-line bg-white/60 p-6">
            {unreviewedLines.length > 1 ? (
              <div className="mb-4">
                <label
                  htmlFor="order-review-product"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
                >
                  {tAccount("detailReviewChooseProduct")}
                </label>
                <select
                  id="order-review-product"
                  value={activeLine.slug}
                  onChange={(e) => setActiveSlug(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/15"
                >
                  {unreviewedLines.map((line) => (
                    <option key={line.slug} value={line.slug}>
                      {line.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <p className="mb-4 text-sm text-muted">{tReviews("purchaseRequiredHint")}</p>
            <ProductReviewForm
              embedded
              productSlug={activeLine.slug}
              productName={activeLine.name}
              cancelHref={`/account/orders/${orderId}`}
              orderId={orderId}
              onSuccess={onReviewSuccess}
            />
          </div>
        </CenterModal>
      ) : null}
    </>
  );
}
