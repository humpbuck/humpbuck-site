"use client";

import { useEffect, useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";

export function AffiliateCouponRequestedModal({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);

  useEffect(() => {
    if (!show) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("ok") !== "coupon_requested") return;
    url.searchParams.delete("ok");
    const next = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [show]);

  if (!open) return null;
  return (
    <CenterModal title="Coupon request submitted" onClose={() => setOpen(false)}>
      <p className="text-sm leading-relaxed text-ink/90">
        Your coupon code request has been sent to admin. Please wait for review and approval. The coupon
        code will appear here automatically once it is created and bound to your account.
      </p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-5 rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper hover:bg-ink/90"
      >
        Got it
      </button>
    </CenterModal>
  );
}
