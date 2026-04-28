"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  formId: string;
  submitButtonId: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending / 待处理",
  eligible: "Eligible / 可结算",
  paid: "Paid / 已支付",
  reversed: "Reversed / 已冲销",
};

export function SettlementBulkActions({ formId, submitButtonId }: Props) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [allChecked, setAllChecked] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const collect = () => {
      const all = Array.from(
        form.querySelectorAll<HTMLInputElement>('input[name="ledgerIds"]'),
      ).filter((el) => !el.disabled);
      const checked = all.filter((el) => el.checked);
      setSelectedCount(checked.length);
      setAllChecked(all.length > 0 && checked.length === all.length);
    };

    collect();
    form.addEventListener("change", collect);
    return () => form.removeEventListener("change", collect);
  }, [formId]);

  const targetLabel = useMemo(
    () => STATUS_LABELS[targetStatus] ?? targetStatus,
    [targetStatus],
  );

  return (
    <div className="rounded-xl border border-line bg-paper/70 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/90">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => {
              const form = document.getElementById(formId) as HTMLFormElement | null;
              if (!form) return;
              const all = Array.from(
                form.querySelectorAll<HTMLInputElement>('input[name="ledgerIds"]'),
              ).filter((el) => !el.disabled);
              for (const box of all) box.checked = e.target.checked;
              form.dispatchEvent(new Event("change", { bubbles: true }));
            }}
          />
          <span>Select all (current page) / 全选（当前页）</span>
        </label>
        <select
          name="targetSettlementStatus"
          value={targetStatus}
          onChange={(e) => setTargetStatus(e.target.value)}
          className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink outline-none ring-ink/20 focus:ring-2"
        >
          <option value="">Select status / 选择状态</option>
          <option value="paid">Paid / 已支付</option>
          <option value="eligible">Eligible / 可结算</option>
          <option value="pending">Pending / 待处理</option>
          <option value="reversed">Reversed / 已冲销</option>
        </select>
        <button
          type="button"
          onClick={() => {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            if (!form) return;
            const checked = Array.from(
              form.querySelectorAll<HTMLInputElement>('input[name="ledgerIds"]:checked'),
            );
            if (checked.length === 0) {
              window.alert("Please select at least one settlement order first. 请先选择至少一条结算记录。");
              return;
            }
            if (!targetStatus) {
              window.alert("Please select target status first. 请先选择目标状态。");
              return;
            }
            const hasPaid = checked.some(
              (el) => String(el.dataset.settlementStatus ?? "").toLowerCase() === "paid",
            );
            if (hasPaid && targetStatus !== "paid") {
              const ok = window.confirm(
                `是否将已付佣金的订单改为 ${targetLabel} 状态？`,
              );
              if (!ok) return;
            }
            const submitBtn = document.getElementById(submitButtonId) as HTMLButtonElement | null;
            submitBtn?.click();
          }}
          className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink transition hover:border-ink/20"
        >
          Apply status to selected / 批量修改状态（已选 {selectedCount}）
        </button>
      </div>
    </div>
  );
}
