"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutAddressForm } from "@/components/checkout/checkout-address-form";
import {
  addressFormToRecord,
  isCheckoutAddressComplete,
  type CheckoutAddressForm,
  validateCheckoutAddressForm,
} from "@/lib/checkout-address";

export function OrderEditShippingForm({
  orderId,
  initial,
  canEdit,
  cancelHref,
}: {
  orderId: string;
  initial: CheckoutAddressForm;
  canEdit: boolean;
  /** Defaults to order detail page */
  cancelHref?: string;
}) {
  const backHref = cancelHref ?? `/account/orders/${orderId}`;
  const router = useRouter();
  const [shipping, setShipping] = useState<CheckoutAddressForm>(initial);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [okTone, setOkTone] = useState<"success" | "neutral">("success");
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    setOkMsg(null);
    if (!isCheckoutAddressComplete(shipping)) {
      setError("Please complete all required address fields.");
      return;
    }
    const c = validateCheckoutAddressForm(shipping);
    if (!c.ok) {
      setError(c.error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/shipping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping: addressFormToRecord(shipping) }),
      });
      const data = (await res.json()) as {
        error?: string;
        merchantNotified?: boolean;
        buyerNotified?: boolean;
        unchanged?: boolean;
      };
      if (!res.ok) throw new Error(data.error || "Update failed");
      if (data.unchanged) {
        setOkTone("neutral");
        setOkMsg(
          "No changes detected — your shipping address was already saved. No emails were sent.",
        );
        return;
      }
      setOkTone("success");
      const m = data.merchantNotified === true;
      const b = data.buyerNotified === true;
      if (m && b) {
        setOkMsg(
          "Shipping address updated. We’ve emailed you a confirmation and notified the shop.",
        );
      } else if (b && !m) {
        setOkMsg(
          "Shipping address updated. We emailed you a confirmation; the shop notification could not be sent.",
        );
      } else if (m && !b) {
        setOkMsg(
          "Shipping address updated. The shop was notified; we could not send a confirmation to your email.",
        );
      } else {
        setOkMsg(
          "Shipping address updated. Email notifications could not be sent — we still saved your address.",
        );
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (!canEdit) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p>
          This order can no longer be edited here (for example, it may not be
          paid yet, or a tracking number has already been added).
        </p>
        <Link
          href={backHref}
          className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
        >
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <CheckoutAddressForm
        idPrefix="order-ship"
        title="Shipping address"
        value={shipping}
        onChange={setShipping}
      />

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p
          className={
            okTone === "neutral"
              ? "rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          }
          role="status"
        >
          {okMsg}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => void save()}
          className="rounded-2xl bg-ink px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save shipping address"}
        </button>
        <Link
          href={backHref}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
