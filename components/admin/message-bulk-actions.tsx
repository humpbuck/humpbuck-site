"use client";

import { useMemo, useState } from "react";

export function MessageBulkActions({
  formId,
}: {
  formId: string;
}) {
  const [selectedAll, setSelectedAll] = useState(false);

  const checkboxSelector = useMemo(
    () => `input[type="checkbox"][name="selected"][form="${formId}"]`,
    [formId],
  );

  const toggleAll = () => {
    const boxes = Array.from(document.querySelectorAll<HTMLInputElement>(checkboxSelector));
    const next = !selectedAll;
    boxes.forEach((box) => {
      box.checked = next;
    });
    setSelectedAll(next);
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={toggleAll}
        className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink transition hover:border-ink/20"
      >
        {selectedAll ? "Unselect all" : "Select all"}
      </button>
      <button
        type="submit"
        form={formId}
        className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-700 transition hover:border-rose-300"
      >
        Delete selected
      </button>
    </div>
  );
}
