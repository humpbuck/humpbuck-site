"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  buyerCancelBlockedReason,
  buyerCancelShowsRefundNotice,
  canBuyerCancelOrder,
} from "@/lib/account-buyer-order";
import { CenterModal } from "@/components/ui/center-modal";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

type OrderLike = {
  id: string;
  status: string;
  trackingNumber: string | null;
};

type ModalStep = "confirm" | "success" | "shipped" | "error";

function ContactActionButtons({
  supportEmail,
  whatsappUrl,
  whatsappDisplay,
}: {
  supportEmail: string;
  whatsappUrl: string;
  whatsappDisplay: string;
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
        WhatsApp {whatsappDisplay}
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
      setErrMsg("This order cannot be cancelled online.");
      return;
    }
    setModal("confirm");
  }, [canCancel, shippedBlock]);

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
        setErrMsg(data.message || data.error || "Could not cancel order.");
        return;
      }
      setModal("success");
    } catch {
      setModal("error");
      setErrMsg("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [order.id]);

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
      ? "Cancel this order?"
      : modal === "success"
        ? "Order cancelled"
        : modal === "shipped"
          ? "Cannot cancel this order"
          : "Something went wrong";

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
            Cancel order
          </button>
        </div>
      ) : null}

      {modal ? (
        <CenterModal title={modalTitle} onClose={closeAll}>
          {modal === "confirm" ? (
            <>
              <p className="text-sm leading-relaxed text-ink/90">
                Order <strong>#{orderNum}</strong> will be marked as cancelled.
                You can no longer edit the shipping address for this order.
              </p>
              {buyerCancelShowsRefundNotice(order) ? (
                <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                    Refunds
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/90">
                    Refunds are reviewed by our team first, usually within 1–2
                    business days. Once approved, your payment will be refunded
                    to your original payment method — thank you for your
                    patience. If you need urgent help, use the options below.
                  </p>
                  <ContactActionButtons
                    supportEmail={support}
                    whatsappUrl={WHATSAPP_URL}
                    whatsappDisplay={WHATSAPP_DISPLAY}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                  <p className="text-sm leading-relaxed text-ink/90">
                    No payment has been captured for this order yet. Cancelling
                    will simply void it — no refund is needed.
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
                  {loading ? "Cancelling…" : "Yes, cancel order"}
                </button>
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-xl border border-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:bg-paper"
                >
                  Keep order
                </button>
              </div>
            </>
          ) : null}

          {modal === "success" ? (
            <>
              <p className="text-sm leading-relaxed text-ink/90">
                Your order was cancelled successfully. We&apos;ve sent a
                confirmation email to you and the shop.
              </p>
              {buyerCancelShowsRefundNotice(order) ? (
                <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                    Refunds
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/90">
                    Refunds are reviewed by our team first, usually within 1–2
                    business days. Once approved, your payment will be refunded
                    to your original payment method — thank you for your
                    patience. If you need urgent help, use the options below.
                  </p>
                  <ContactActionButtons
                    supportEmail={support}
                    whatsappUrl={WHATSAPP_URL}
                    whatsappDisplay={WHATSAPP_DISPLAY}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                  <p className="text-sm leading-relaxed text-ink/90">
                    This order was unpaid — nothing was charged, so no refund
                    applies.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={closeAll}
                className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
              >
                Close
              </button>
            </>
          ) : null}

          {modal === "shipped" ? (
            <>
              <p className="text-sm leading-relaxed text-ink/90">
                This order has shipped and can&apos;t be cancelled from your
                account.
              </p>
              <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                  Contact
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">
                  If you need help with shipment or delivery, reach us using the
                  options below.
                </p>
                <ContactActionButtons
                  supportEmail={support}
                  whatsappUrl={WHATSAPP_URL}
                  whatsappDisplay={WHATSAPP_DISPLAY}
                />
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
              >
                Close
              </button>
            </>
          ) : null}

          {modal === "error" ? (
            <>
              <p className="text-sm text-rose-800">
                {errMsg || "Try again later."}
              </p>
              <div className="mt-4 rounded-xl border border-[#ffe8d9] border-l-4 border-l-[#d97706] bg-[#fffaf5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                  Contact
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">
                  Need help? Reach us using the options below.
                </p>
                <ContactActionButtons
                  supportEmail={support}
                  whatsappUrl={WHATSAPP_URL}
                  whatsappDisplay={WHATSAPP_DISPLAY}
                />
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="mt-6 rounded-xl border border-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink"
              >
                Close
              </button>
            </>
          ) : null}
        </CenterModal>
      ) : null}
    </>
  );
}
