"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  orderId: string;
  orderStatus: string;
  settlementStatus: string;
  eligibleAtLabel: string;
  paidOrReversedAtLabel: string;
  commissionCents: number;
};

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AffiliateSettlementSelector({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedRows = useMemo(() => rows.filter((r) => selected[r.id]), [rows, selected]);
  const selectedCount = selectedRows.length;
  const selectedCommission = selectedRows.reduce((sum, r) => sum + r.commissionCents, 0);
  const allChecked = rows.length > 0 && rows.every((r) => Boolean(selected[r.id]));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-ink/90">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelected(() => {
                if (!checked) return {};
                const next: Record<string, boolean> = {};
                for (const row of rows) next[row.id] = true;
                return next;
              });
            }}
          />
          Select all orders on this page
        </label>
        <span>
          Selected orders: <span className="font-medium tabular-nums">{selectedCount}</span>
        </span>
        <span>
          Selected commission:{" "}
          <span className="font-medium tabular-nums">{usd(selectedCommission)}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm text-ink/90">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-2">Pick</th>
              <th className="px-2 py-2">Order</th>
              <th className="px-2 py-2">Order status</th>
              <th className="px-2 py-2">Settlement</th>
              <th className="px-2 py-2">Eligible at</th>
              <th className="px-2 py-2">Paid / reversed at</th>
              <th className="px-2 py-2 text-right">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/60">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[row.id])}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelected((prev) => ({ ...prev, [row.id]: checked }));
                    }}
                  />
                </td>
                <td className="px-2 py-2">#{row.orderId.slice(-8)}</td>
                <td className="px-2 py-2">{row.orderStatus}</td>
                <td className="px-2 py-2">{row.settlementStatus}</td>
                <td className="px-2 py-2">{row.eligibleAtLabel}</td>
                <td className="px-2 py-2">{row.paidOrReversedAtLabel}</td>
                <td className="px-2 py-2 text-right tabular-nums">{usd(row.commissionCents)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-2 py-3 text-muted" colSpan={7}>
                  No orders in this settlement status yet. Keep sharing your affiliate link - your next conversion is coming soon.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
