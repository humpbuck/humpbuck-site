"use client";

import { useMemo, useState } from "react";

type Props = {
  baseQuery: string;
  initialStartDate: string;
  initialEndDate: string;
};

function buildExportHref(input: {
  mode: "eligible" | "paid" | "all";
  baseQuery: string;
  startDate: string;
  endDate: string;
}): string {
  const qs = new URLSearchParams(input.baseQuery);
  qs.set("mode", input.mode);
  qs.set("holdDays", "30");
  if (input.startDate) qs.set("startDate", input.startDate);
  else qs.delete("startDate");
  if (input.endDate) qs.set("endDate", input.endDate);
  else qs.delete("endDate");
  return `/api/admin/affiliate/payouts/export?${qs.toString()}`;
}

export function PayoutExportLinks({
  baseQuery,
  initialStartDate,
  initialEndDate,
}: Props) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const eligibleHref = useMemo(
    () => buildExportHref({ mode: "eligible", baseQuery, startDate, endDate }),
    [baseQuery, endDate, startDate],
  );
  const paidHref = useMemo(
    () => buildExportHref({ mode: "paid", baseQuery, startDate, endDate }),
    [baseQuery, endDate, startDate],
  );
  const allHref = useMemo(
    () => buildExportHref({ mode: "all", baseQuery, startDate, endDate }),
    [baseQuery, endDate, startDate],
  );

  return (
    <>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
      </div>
      <p className="mt-3">
        <a
          href={eligibleHref}
          className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
        >
          Export eligible CSV (30d)
        </a>
      </p>
      <p className="mt-2 flex flex-wrap gap-2">
        <a
          href={paidHref}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
        >
          Export paid CSV
        </a>
        <a
          href={allHref}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20"
        >
          Export all ledger CSV
        </a>
      </p>
    </>
  );
}
