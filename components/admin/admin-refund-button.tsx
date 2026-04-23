"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  orderId: string;
  /** USD formatted for display */
  totalLabel: string;
  providerLabel: string;
  canRefund: boolean;
  disabledReason?: string | null;
};

export function AdminRefundButton({
  orderId,
  totalLabel,
  providerLabel,
  canRefund,
  disabledReason,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onRefund = useCallback(async () => {
    if (!canRefund || loading) return;
    if (
      !window.confirm(
        `Refund ${totalLabel} to the customer via ${providerLabel}? This uses the payment provider API and marks the order as Refunded.`,
      )
    ) {
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setErr(data.error || "Refund failed");
        setLoading(false);
        return;
      }
      setMsg("Refund processed. Order status set to Refunded.");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, [canRefund, loading, orderId, providerLabel, router, totalLabel]);

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-5 ring-1 ring-amber-200/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900/90">
        Refund payment
      </p>
      <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
        Issue a full refund for <strong>{totalLabel}</strong> through{" "}
        {providerLabel}. The customer is refunded to their original payment
        method; this cannot be undone from here.
      </p>
      {disabledReason ? (
        <p className="mt-3 text-xs text-amber-900/75">{disabledReason}</p>
      ) : null}
      {err ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p className="mt-3 text-sm text-green-900" role="status">
          {msg}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!canRefund || loading}
        onClick={() => void onRefund()}
        className="mt-4 rounded-xl bg-amber-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-amber-50 transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? "Processing…" : `Refund ${totalLabel} (${providerLabel})`}
      </button>
    </div>
  );
}
