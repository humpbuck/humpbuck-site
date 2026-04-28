"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  orderCode: string;
  orderTotalCents: number;
  commissionCents: number;
};

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function SettlementSelectionSummary({ formId }: { formId: string }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const collect = () => {
      const selected = Array.from(
        form.querySelectorAll<HTMLInputElement>('input[name="ledgerIds"]:checked'),
      );
      const nextRows = selected.map((el) => ({
        orderCode: String(el.dataset.orderCode ?? ""),
        orderTotalCents: Number(el.dataset.orderTotalCents ?? "0"),
        commissionCents: Number(el.dataset.commissionCents ?? "0"),
      }));
      setRows(nextRows);
    };

    collect();
    form.addEventListener("change", collect);
    return () => form.removeEventListener("change", collect);
  }, [formId]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.orderTotalCents += Number.isFinite(r.orderTotalCents) ? r.orderTotalCents : 0;
        acc.commissionCents += Number.isFinite(r.commissionCents) ? r.commissionCents : 0;
        return acc;
      },
      { orderTotalCents: 0, commissionCents: 0 },
    );
  }, [rows]);

  return (
    <div className="rounded-xl border border-line bg-paper/70 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        Selected summary
      </p>
      <p className="mt-2 text-xs text-ink/90">
        Orders: <span className="font-medium">{rows.length}</span> · Total order amount:{" "}
        <span className="font-medium tabular-nums">{usd(totals.orderTotalCents)}</span> · Total
        commission: <span className="font-medium tabular-nums">{usd(totals.commissionCents)}</span>
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No orders selected yet.</p>
      ) : null}
    </div>
  );
}
