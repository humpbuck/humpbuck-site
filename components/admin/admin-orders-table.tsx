"use client";

import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatPrice } from "@/lib/catalog";
import {
  customerNameFromEmail,
  orderDisplayId,
  paymentProviderLabel,
  trafficSourceLabel,
} from "@/lib/admin/order-ui";

export type AdminOrderRow = {
  id: string;
  email: string;
  status: string;
  totalCents: number;
  trackingNumber: string | null;
  provider: string;
  trafficSource: string;
  createdAt: string;
};

export function AdminOrdersTable({ rows }: { rows: AdminOrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const idsOnPage = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected =
    idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (idsOnPage.length === 0) return prev;
      if (idsOnPage.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(idsOnPage);
    });
  }, [idsOnPage]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function deleteOne(id: string) {
    if (!confirm("Delete this order permanently? This cannot be undone.")) {
      return;
    }
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Delete failed");
        return;
      }
      setSelected((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteSelected() {
    const list = [...selected];
    if (list.length === 0) return;
    if (
      !confirm(
        `Delete ${list.length} order(s) permanently? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: list }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error || "Delete failed");
        return;
      }
      setSelected(new Set());
      refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm">
          <span className="font-medium text-red-950">
            {selected.size} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={deleteSelected}
              className="rounded-xl bg-red-800 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-red-900 disabled:opacity-50"
            >
              {bulkBusy ? "Deleting…" : "Delete selected"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white/60 shadow-sm">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead>
            <tr className="border-b border-line/80 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-line text-ink"
                  aria-label="Select all on this page"
                />
              </th>
              <th className="px-3 py-3">Order</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="min-w-[160px] px-3 py-3">Tracking</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-2 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const displayId = orderDisplayId(o.id);
              const name = customerNameFromEmail(o.email);
              const dateStr = new Date(o.createdAt).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              );
              const isBusy = busy === o.id;
              return (
                <tr
                  key={o.id}
                  className="border-b border-line/60 last:border-0 hover:bg-paper/40"
                >
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      className="rounded border-line text-ink"
                      aria-label={`Select order ${displayId}`}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-sky-800 underline-offset-2 hover:underline"
                    >
                      #{displayId} {name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-middle text-muted">
                    {dateStr}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-3 text-right align-middle font-medium tabular-nums">
                    {formatPrice(o.totalCents / 100)}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {o.trackingNumber ? (
                      <span className="inline-block max-w-[200px] truncate rounded-md bg-amber-50 px-2 py-1 font-mono text-[11px] text-amber-950 ring-1 ring-amber-200/80">
                        {o.trackingNumber}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle text-muted">
                    {trafficSourceLabel(o.trafficSource)}
                  </td>
                  <td className="px-3 py-3 align-middle text-muted">
                    {paymentProviderLabel(o.provider)}
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex rounded-lg p-1.5 text-sky-700 hover:bg-sky-50"
                        aria-label="View order"
                      >
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      </Link>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => deleteOne(o.id)}
                        className="inline-flex rounded-lg p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Delete order"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
