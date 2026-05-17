"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const selectedRows = useMemo(
    () => rows.filter((r) => selected[r.id]),
    [rows, selected],
  );
  const selectedCount = selectedRows.length;
  const selectedCommission = selectedRows.reduce((sum, r) => sum + r.commissionCents, 0);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);
  const allCheckedOnPage =
    pagedRows.length > 0 && pagedRows.every((row) => Boolean(selected[row.id]));

  useEffect(() => {
    if (page > totalPages) {
      queueMicrotask(() => setPage(totalPages));
    }
  }, [page, totalPages]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink/90">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allCheckedOnPage}
            onChange={(e) => {
              setSelected((prev) => {
                const next = { ...prev };
                for (const row of pagedRows) {
                  next[row.id] = e.target.checked;
                }
                return next;
              });
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
            {pagedRows.map((r) => (
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
      {rows.length > PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-ink/90">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-line bg-white px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="tabular-nums">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-line bg-white px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
