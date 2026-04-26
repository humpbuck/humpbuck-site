"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  orderId: string;
  commissionCents: number;
  paidAtLabel: string;
};

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PaidCommissionSelector({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedRows = useMemo(
    () => rows.filter((r) => selected[r.id]),
    [rows, selected],
  );
  const selectedCount = selectedRows.length;
  const selectedCommission = selectedRows.reduce((sum, r) => sum + r.commissionCents, 0);

  const allChecked = rows.length > 0 && selectedCount === rows.length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink/90">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => {
              const next: Record<string, boolean> = {};
              if (e.target.checked) {
                rows.forEach((r) => {
                  next[r.id] = true;
                });
              }
              setSelected(next);
            }}
          />
          Select all paid orders
        </label>
        <span>
          Selected count: <span className="font-medium tabular-nums">{selectedCount}</span>
        </span>
        <span>
          Selected commission:{" "}
          <span className="font-medium tabular-nums">{usd(selectedCommission)}</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm text-ink/90">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-2">Pick</th>
              <th className="px-2 py-2">Order</th>
              <th className="px-2 py-2">Paid at</th>
              <th className="px-2 py-2 text-right">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[r.id])}
                    onChange={(e) => {
                      setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }));
                    }}
                  />
                </td>
                <td className="px-2 py-2">#{r.orderId.slice(-8)}</td>
                <td className="px-2 py-2">{r.paidAtLabel}</td>
                <td className="px-2 py-2 text-right tabular-nums">{usd(r.commissionCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
