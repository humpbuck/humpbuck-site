"use client";

import { CenterModal } from "@/components/ui/center-modal";
import { useRouter } from "@/i18n/navigation";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";
import { useTranslations } from "next-intl";
import {
  buyerCancelBlockedReason,
  buyerCancelShowsRefundNotice,
  canBuyerCancelOrder,
} from "@/lib/account-buyer-order";
import { useCallback, useState } from "react";

type OrderLike = {
  id: string;
  status: string;
  trackingNumber: string | null;
};

type ModalStep = "confirm" | "success" | "shipped" | "error";

function ContactActionButtons({
  supportEmail,
  whatsappUrl,
  whatsappLabel,
}: {
  supportEmail: string;
  whatsappUrl: string;
  whatsappLabel: string;
}) {
  const linkClass =
    "block w-fit max-w-full break-words text-sm font-medium text-[#5b4dcb] no-underline hover:no-underline focus:no-underline";
  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <a href={`mailto:${supportEmail}`} className={linkClass}>
        {supportEmail}
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {whatsappLabel}
      </a>
    </div>
  );
}

export function BuyerCancelOrderActions({
  order,
  orderNum,
  compact,
  enabled,
}: {
  order: OrderLike;
  orderNum: string;
  /** Smaller controls on order list cards */
  compact?: boolean;
  /** When false, hide (e.g. cancelled / refunded). */
  enabled: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("AccountCancel");
  const [modal, setModal] = useState<ModalStep | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const support = publicSupportEmail();
  const canCancel = canBuyerCancelOrder(order);
  const block = buyerCancelBlockedReason(order);
  const shippedBlock = block === "shipped";

  const openCancel = useCallback(() => {
    setErrMsg(null);
    if (shippedBlock) {
      setModal("shipped");
      return;
    }
    if (!canCancel) {
      setModal("error");
      setErrMsg(t("errCannotOnline"));
      return;
    }
    setModal("confirm");
  }, [canCancel, shippedBlock, t]);

  const doCancel = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await fetch(`/api/account/orders/${order.id}/cancel`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        ok?: boolean;
      };
      if (res.status === 409 || data.error === "already_shipped") {
        setModal("shipped");
        return;
      }
      if (!res.ok) {
        setModal("error");
        setErrMsg(data.message || data.error || t("errCancelFailed"));
        return;
      }
      setModal("success");
    } catch {
      setModal("error");
      setErrMsg(t("errNetwork"));
    } finally {
      setLoading(false);
    }
  }, [order.id, t]);

  const closeAll = useCallback(() => {
    const wasSuccess = modal === "success";
    setModal(null);
    setErrMsg(null);
    if (wasSuccess) {
      router.refresh();
    }
  }, [modal, router]);

  /** After cancel succeeds, `enabled` becomes false on refresh — keep modal mounted until user closes. */
  if (!enabled && modal === null) {
    return null;
  }

  const modalTitle =
    modal === "confirm"
      ? t("modalConfirmTitle")
      : modal === "success"
        ? t("modalSuccessTitle")
        : modal === "shipped"
          ? t("modalShippedTitle")
          : t("modalErrorTitle");

  const whatsappLabel = t("whatsappLink", { display: WHATSAPP_DISPLAY });

  return (
    <>
      {enabled ? (
        <div
          className={
            compact ? "mt-4 flex flex-wrap items-center gap-4" : "mt-6"
          }
        >
          <button
            type="button"
            onClick={() => openCancel()}
            className={`text-[12px] font-semibold uppercase tracking-[0.12em] text-rose-700 underline-offset-4 hover:underline ${compact ? "" : "block"}`}
          >
            {t("openCancel")}
          </button>
        </div>
      ) : null}

      {modal ? (
        <CenterModal title={modalTitle} onClose={closeAll}>
          {modal === "confirm" ? (
            <>
              <p className="text-sm leading-relaxed text-ink/90">
                {t("confirmBody", { orderNum })}
              </p>
              {buyerCancelShowsRefundNotice(order) ? (
                <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                    {t("refundsLabel")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/90">
                    {t("refundsNotice")}
                  </p>
                  <ContactActionButtons
                    supportEmail={support}
                    whatsappUrl={WHATSAPP_URL}
                    whatsappLabel={whatsappLabel}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                  <p className="text-sm leading-relaxed text-ink/90">
                    {t("noPaymentCaptured")}
                  </p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void doCancel()}
                  className="rounded-xl bg-rose-700 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-white hover:bg-rose-800 disabled:opacity-50"
                >
                  {loading ? t("cancelling") : t("yesCancel")}
                </button>
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-xl border border-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:bg-paper"
                >
                  {t("keepOrder")}
                </button>
              </div>
            </>
          ) : null}

          {modal === "success" ? (
            <>
              <p className="text-sm leading-relaxed text-ink/90">
                {t("successBody")}
              </p>
              {buyerCancelShowsRefundNotice(order) ? (
                <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                    {t("refundsLabel")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/90">
                    {t("refundsNotice")}
                  </p>
                  <ContactActionButtons
                    supportEmail={support}
                    whatsappUrl={WHATSAPP_URL}
                    whatsappLabel={whatsappLabel}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                  <p className="text-sm leading-relaxed text-ink/90">
                    {t("successUnpaid")}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={closeAll}
                className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
              >
                {t("close")}
              </button>
            </>
          ) : null}

          {modal === "shipped" ? (
            <>
              <p className="text-sm leading-relaxed text-ink/90">
                {t("shippedBody")}
              </p>
              <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                  {t("contactLabel")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">
                  {t("shippedHelp")}
                </p>
                <ContactActionButtons
                  supportEmail={support}
                  whatsappUrl={WHATSAPP_URL}
                  whatsappLabel={whatsappLabel}
                />
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
              >
                {t("close")}
              </button>
            </>
          ) : null}

          {modal === "error" ? (
            <>
              <p className="text-sm text-rose-800">
                {errMsg || t("errTryLater")}
              </p>
              <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                  {t("contactLabel")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">
                  {t("errNeedHelp")}
                </p>
                <ContactActionButtons
                  supportEmail={support}
                  whatsappUrl={WHATSAPP_URL}
                  whatsappLabel={whatsappLabel}
                />
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="mt-6 rounded-xl border border-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink"
              >
                {t("close")}
              </button>
            </>
          ) : null}
        </CenterModal>
      ) : null}
    </>
  );
}
