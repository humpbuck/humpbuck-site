"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BuyerConfirmReceivedButton({
  orderId,
  enabled,
}: {
  orderId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!enabled) return null;

  async function onConfirm() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/confirm-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to confirm receipt.");
      }
      setMsg("Thank you. This order is now marked as delivered.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to confirm receipt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm text-emerald-950">
        Received your order? Confirm receipt to complete this delivery.
      </p>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-emerald-800 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-900 disabled:opacity-50"
      >
        {loading ? "Confirming…" : "Confirm received"}
      </button>
      {msg ? <p className="mt-2 text-xs text-emerald-900">{msg}</p> : null}
      {err ? <p className="mt-2 text-xs text-rose-700">{err}</p> : null}
    </div>
  );
}

