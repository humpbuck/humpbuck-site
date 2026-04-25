"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminOrdersFilter } from "@/lib/admin/order-filters";

const FILTERS: { value: AdminOrdersFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unshipped", label: "Unshipped" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export function OrderSearchBar({
  currentFilter,
  currentSearch,
  currentDateFrom,
  currentDateTo,
}: {
  currentFilter: AdminOrdersFilter;
  currentSearch: string;
  currentDateFrom: string;
  currentDateTo: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  function buildUrl(overrides?: {
    filter?: AdminOrdersFilter;
    q?: string;
    from?: string;
    to?: string;
  }) {
    const p = new URLSearchParams();
    const f = overrides?.filter ?? currentFilter;
    const q = overrides?.q ?? search;
    const from = overrides?.from ?? dateFrom;
    const to = overrides?.to ?? dateTo;
    if (f !== "all") p.set("filter", f);
    if (q) p.set("q", q);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    // Use window.location.pathname to stay on the current admin path
    const base = window.location.pathname;
    return qs ? `${base}?${qs}` : base;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl());
  }

  function handleFilterClick(f: AdminOrdersFilter) {
    router.push(buildUrl({ filter: f }));
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterClick(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              currentFilter === f.value
                ? "bg-ink text-paper"
                : "border border-line bg-white/70 text-ink hover:border-ink/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search + date range */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, order code, tracking #..."
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/30"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/30"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-paper transition hover:bg-ink/90"
        >
          Search
        </button>
        {(search || dateFrom || dateTo || currentFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
              router.push(window.location.pathname);
            }}
            className="rounded-lg border border-line bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink transition hover:border-ink/20"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}
