"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const STATUSES = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Completed (shipped)" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const;

export function OrderEditForm({
  orderId,
  initialStatus,
  initialCarrier,
  initialTracking,
}: {
  orderId: string;
  initialStatus: string;
  initialCarrier: string | null;
  initialTracking: string | null;
}) {
  const router = useRouter();
  const statusOptions = useMemo(() => {
    const known = new Set<string>(STATUSES.map((s) => s.value));
    if (known.has(initialStatus)) return [...STATUSES];
    return [
      { value: initialStatus, label: `Legacy: ${initialStatus}` },
      ...STATUSES,
    ];
  }, [initialStatus]);
  const [status, setStatus] = useState(initialStatus);
  const [carrier, setCarrier] = useState(initialCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          carrier: carrier.trim() || null,
          trackingNumber: trackingNumber.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Update failed");
        setLoading(false);
        return;
      }
      setMsg("Saved.");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-8">
      <div className="rounded-2xl bg-zinc-100/90 p-5 ring-1 ring-zinc-200/80">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Tracking & carrier
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="tracking"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
            >
              Tracking number
            </label>
            <input
              id="tracking"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Paste tracking ID"
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="carrier"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
            >
              Carrier
            </label>
            <input
              id="carrier"
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. DHL, USPS, FedEx"
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="status"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
        >
          Order status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-2 w-full max-w-md rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {err && (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      )}
      {msg && <p className="text-sm text-green-800">{msg}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
