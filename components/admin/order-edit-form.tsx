"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FULFILLMENT_CARRIER_OPTIONS,
  parseCarrierForSelect,
} from "@/lib/admin/carrier-options";

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
  initialMerchantOrderCode,
}: {
  orderId: string;
  initialStatus: string;
  initialCarrier: string | null;
  initialTracking: string | null;
  initialMerchantOrderCode: string | null;
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
  const initialCarrierParsed = useMemo(
    () => parseCarrierForSelect(initialCarrier),
    [initialCarrier],
  );
  const [carrierSelect, setCarrierSelect] = useState(
    initialCarrierParsed.select,
  );
  const [carrierCustom, setCarrierCustom] = useState(
    initialCarrierParsed.custom,
  );
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? "");
  const [merchantOrderCode, setMerchantOrderCode] = useState(
    initialMerchantOrderCode ?? "",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prevOrderId = useRef(orderId);

  // Keep fields in sync when the server sends new props after save (without remounting the form).
  useEffect(() => {
    if (prevOrderId.current !== orderId) {
      prevOrderId.current = orderId;
      setMsg(null);
      setErr(null);
    }
    setStatus(initialStatus);
    const p = parseCarrierForSelect(initialCarrier);
    setCarrierSelect(p.select);
    setCarrierCustom(p.custom);
    setTrackingNumber(initialTracking ?? "");
    setMerchantOrderCode(initialMerchantOrderCode ?? "");
  }, [
    orderId,
    initialStatus,
    initialCarrier,
    initialTracking,
    initialMerchantOrderCode,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    if (!status) {
      setErr("Pick an order status.");
      setLoading(false);
      return;
    }
    try {
      const carrierValue =
        carrierSelect === "__custom__"
          ? carrierCustom.trim() || null
          : carrierSelect === ""
            ? null
            : carrierSelect;
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          status,
          carrier: carrierValue,
          trackingNumber: trackingNumber.trim() || null,
          merchantOrderCode: merchantOrderCode.trim() || null,
        }),
      });

      const raw = await res.text();
      let data: {
        error?: string;
        shipmentEmail?: {
          sent: boolean;
          reason?: string;
          detail?: string;
        };
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setErr(
          res.ok
            ? "Saved, but the server response was unreadable. Refresh the page."
            : `Update failed (HTTP ${res.status}).`,
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErr(data.error || "Update failed");
        setLoading(false);
        return;
      }

      let line = "Saved.";
      const se = data.shipmentEmail;
      if (se?.sent) {
        line += " Shipment email sent to the customer.";
      } else if (se && !se.sent) {
        switch (se.reason) {
          case "status_not_shipped":
            line +=
              " (Shipment email only sends when status is Completed (shipped) with carrier + tracking.)";
            break;
          case "missing_carrier_or_tracking":
            line +=
              " (Shipment email needs carrier and tracking number when status is shipped.)";
            break;
          case "already_sent":
            line +=
              " Shipment email was already sent for this order (one per order).";
            break;
          case "brevo_failed":
            line += ` Email could not be sent — check Brevo API key / sender. ${se.detail ?? ""}`;
            break;
          case "build_failed":
            line += ` Email template error. ${se.detail ?? ""}`;
            break;
          default:
            break;
        }
      }
      setMsg(line);
      // Let React paint the message before RSC refresh; avoids flash of empty state.
      requestAnimationFrame(() => {
        router.refresh();
      });
    } catch {
      setErr("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
      <div className="rounded-2xl bg-zinc-100/90 p-5 ring-1 ring-zinc-200/80">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Order number (shop)
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Shown to customers in emails and account instead of the short ID when
          set. Leave blank to use the default order code.
        </p>
        <label htmlFor="merchant-order-code" className="sr-only">
          Merchant order number
        </label>
        <input
          id="merchant-order-code"
          type="text"
          value={merchantOrderCode}
          onChange={(e) => setMerchantOrderCode(e.target.value)}
          maxLength={64}
          placeholder="e.g. HB-2026-1042"
          className="mt-3 w-full max-w-md rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
        />
      </div>

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
            <select
              id="carrier"
              value={carrierSelect}
              onChange={(e) => {
                const v = e.target.value;
                setCarrierSelect(v);
                if (v !== "__custom__") setCarrierCustom("");
              }}
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
            >
              <option value="">Select carrier…</option>
              {FULFILLMENT_CARRIER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {carrierSelect === "__custom__" ? (
              <input
                type="text"
                value={carrierCustom}
                onChange={(e) => setCarrierCustom(e.target.value)}
                placeholder="Carrier name (saved as entered)"
                className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-ink/20 focus:ring-2"
                aria-label="Custom carrier name"
              />
            ) : null}
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
      {msg && (
        <p
          className={`text-sm ${
            msg.includes("could not be sent") || msg.includes("template error")
              ? "text-amber-900"
              : "text-green-800"
          }`}
          role="status"
        >
          {msg}
        </p>
      )}
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
