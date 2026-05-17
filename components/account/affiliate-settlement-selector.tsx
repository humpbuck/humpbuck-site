"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

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

export function AffiliateSettlementSelector({
  rows,
  scopeKey,
}: {
  rows: Row[];
  scopeKey: string;
}) {
  const t = useTranslations("AccountAffiliate");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const storageKey = `affiliate_settlement_selected_v1:${scopeKey}`;

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (parsed && typeof parsed === "object") {
        queueMicrotask(() => setSelected(parsed));
      }
    } catch {
      // ignore malformed cache
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(selected));
    } catch {
      // ignore quota/private mode
    }
  }, [selected, storageKey]);

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);
  const selectedCommission = useMemo(
    () => Object.values(selected).reduce((sum, cents) => sum + cents, 0),
    [selected],
  );
  const allChecked = rows.length > 0 && rows.every((r) => selected[r.id] != null);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-ink/90">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelected((prev) => {
                const next = { ...prev };
                if (!checked) {
                  for (const row of rows) delete next[row.id];
                  return next;
                }
                for (const row of rows) {
                  next[row.id] = row.commissionCents;
                }
                return next;
              });
            }}
          />
          {t("settlementUi.selectAll")}
        </label>
        <span>
          {t("settlementUi.selectedOrders")}{" "}
          <span className="font-medium tabular-nums">{selectedCount}</span>
        </span>
        <span>
          {t("settlementUi.selectedCommission")}{" "}
          <span className="font-medium tabular-nums">{usd(selectedCommission)}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm text-ink/90">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-2">{t("settlementUi.colPick")}</th>
              <th className="px-2 py-2">{t("settlementUi.colOrder")}</th>
              <th className="px-2 py-2">{t("settlementUi.colOrderStatus")}</th>
              <th className="px-2 py-2">{t("settlementUi.colSettlement")}</th>
              <th className="px-2 py-2">{t("settlementUi.colEligibleAt")}</th>
              <th className="px-2 py-2">{t("settlementUi.colPaidReversed")}</th>
              <th className="px-2 py-2 text-right">{t("settlementUi.colCommission")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/60">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected[row.id] != null}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelected((prev) => {
                        const next = { ...prev };
                        if (checked) next[row.id] = row.commissionCents;
                        else delete next[row.id];
                        return next;
                      });
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
                  {t("settlementUi.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
