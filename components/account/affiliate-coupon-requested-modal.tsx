"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";

export function AffiliateCouponRequestedModal({
  show,
  requestId,
}: {
  show: boolean;
  requestId?: string;
}) {
  const t = useTranslations("AccountAffiliate");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) return;
    const rid = String(requestId ?? "").trim();
    if (!rid) return;
    const seenKey = "affiliate_coupon_request_seen_rid";
    const lastSeenRid = window.sessionStorage.getItem(seenKey);
    if (lastSeenRid === rid) return;
    window.sessionStorage.setItem(seenKey, rid);
    queueMicrotask(() => setOpen(true));

    const url = new URL(window.location.href);
    if (url.searchParams.get("ok") !== "coupon_requested") return;
    url.searchParams.delete("ok");
    url.searchParams.delete("rid");
    const next = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [show, requestId]);

  if (!open) return null;
  return (
    <CenterModal title={t("couponModal.title")} onClose={() => setOpen(false)}>
      <p className="text-sm leading-relaxed text-ink/90">{t("couponModal.body")}</p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-5 rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
      >
        {t("couponModal.ok")}
      </button>
    </CenterModal>
  );
}
