"use client";

import { useEffect, useMemo, useState } from "react";
import type { WholesaleListingRow } from "@/lib/wholesale-listing-shared";
import { wholesaleListingPublicPath } from "@/lib/wholesale-listing-shared";

const ADMIN_PAGE_SIZE = 5;

type DraftRow = WholesaleListingRow & { isNew?: boolean };

function cleanMediaUrls(urls: string[]): string[] {
  return urls.map((x) => x.trim()).filter(Boolean);
}

function mediaDraftSeed(urls: string[]): string[] {
  return urls.length > 0 ? [...urls] : [""];
}

function emptyRow(sortOrder: number): DraftRow {
  return {
    id: `new-${Date.now()}`,
    slug: "",
    modelNumber: "",
    description: "",
    priceUsd: 0,
    mediaUrls: [],
    status: "active",
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
    isNew: true,
  };
}

export function WholesaleListingManager({
  initialRows,
}: {
  initialRows: WholesaleListingRow[];
}) {
  const [rows, setRows] = useState<DraftRow[]>(initialRows);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [mediaDrafts, setMediaDrafts] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(initialRows.map((r) => [r.id, mediaDraftSeed(r.mediaUrls)])),
  );

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ADMIN_PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE;
    return sortedRows.slice(start, start + ADMIN_PAGE_SIZE);
  }, [page, sortedRows]);

  function setMediaUrlAt(rowId: string, index: number, value: string) {
    setMediaDrafts((prev) => {
      const current = [...(prev[rowId] ?? [""])];
      current[index] = value;
      return { ...prev, [rowId]: current };
    });
  }

  function addMediaUrlField(rowId: string) {
    setMediaDrafts((prev) => {
      const current = [...(prev[rowId] ?? [""])];
      if (current.length >= 24) return prev;
      return { ...prev, [rowId]: [...current, ""] };
    });
  }

  function removeMediaUrlField(rowId: string, index: number) {
    setMediaDrafts((prev) => {
      const current = [...(prev[rowId] ?? [""])];
      if (current.length <= 1) {
        return { ...prev, [rowId]: [""] };
      }
      current.splice(index, 1);
      return { ...prev, [rowId]: current };
    });
  }

  async function saveRow(row: DraftRow) {
    const mediaUrls = cleanMediaUrls(mediaDrafts[row.id] ?? []);
    if (mediaUrls.length === 0) {
      setMessage("Add at least one R2 media URL (image or video).");
      return;
    }
    if (!window.confirm(`Save wholesale listing${row.modelNumber ? ` ${row.modelNumber}` : ""}?`)) {
      return;
    }
    setBusyId(row.id);
    setMessage("");
    const payload = {
      slug: row.slug,
      modelNumber: row.modelNumber,
      description: row.description,
      priceUsd: row.priceUsd,
      mediaUrls,
      status: row.status,
      sortOrder: row.sortOrder,
    };
    const res = row.isNew
      ? await fetch("/api/admin/wholesale-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/wholesale-listings/${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const data = (await res.json().catch(() => ({}))) as {
      listing?: WholesaleListingRow;
      error?: string;
    };
    if (!res.ok || !data.listing) {
      setMessage(data.error ?? "Save failed");
      setBusyId(null);
      return;
    }
    const saved = data.listing;
    setRows((prev) => {
      const withoutDraft = prev.filter((x) => x.id !== row.id);
      const existing = withoutDraft.some((x) => x.id === saved.id);
      if (existing) {
        return withoutDraft.map((x) => (x.id === saved.id ? { ...saved, isNew: false } : x));
      }
      return [...withoutDraft, { ...saved, isNew: false }];
    });
    setMediaDrafts((prev) => {
      const next = { ...prev };
      if (row.isNew) delete next[row.id];
      next[saved.id] = mediaDraftSeed(saved.mediaUrls);
      return next;
    });
    setMessage(`Saved${saved.modelNumber ? ` ${saved.modelNumber}` : ""}.`);
    setBusyId(null);
  }

  async function deleteRow(row: DraftRow) {
    if (row.isNew) {
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      setMediaDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      return;
    }
    if (!window.confirm(`Delete listing${row.modelNumber ? ` ${row.modelNumber}` : ""}?`)) {
      return;
    }
    setBusyId(row.id);
    setMessage("");
    const res = await fetch(`/api/admin/wholesale-listings/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setMessage("Delete failed");
      setBusyId(null);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== row.id));
    setMediaDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setMessage("Deleted.");
    setBusyId(null);
  }

  async function saveOrder(nextRows: DraftRow[]) {
    const persisted = nextRows.filter((x) => !x.isNew);
    if (persisted.length === 0) return;
    if (!window.confirm("Update display order on the wholesale page?")) return;
    const res = await fetch("/api/admin/wholesale-listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: persisted.map((x) => x.id) }),
    });
    if (!res.ok) {
      setMessage("Order save failed");
      return;
    }
    setMessage("Order updated.");
  }

  function moveToPosition(globalIdx: number, position1Based: number) {
    const clamped = Math.max(1, Math.min(sortedRows.length, position1Based));
    const next = [...sortedRows];
    const [picked] = next.splice(globalIdx, 1);
    next.splice(clamped - 1, 0, picked);
    const normalized = next.map((row, i) => ({ ...row, sortOrder: i + 1 }));
    setRows(normalized);
    void saveOrder(normalized);
  }

  function addRow() {
    const nextOrder =
      sortedRows.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1;
    const row = emptyRow(nextOrder);
    setRows((prev) => [...prev, row]);
    setMediaDrafts((prev) => ({ ...prev, [row.id]: [""] }));
    setPage(Math.max(1, Math.ceil((sortedRows.length + 1) / ADMIN_PAGE_SIZE)));
    setMessage("");
  }

  function patchRow(id: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  return (
    <div>
      {message ? (
        <p className="mb-4 rounded-xl border border-line bg-white/60 px-3 py-2 text-sm text-muted">
          {message}
        </p>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-line bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 hover:bg-paper"
        >
          Add listing
        </button>
        <p className="text-xs text-muted">
          One R2 URL per field (image or video). The first link is the card thumbnail.
        </p>
      </div>
      <div className="space-y-4">
        {pageRows.map((row, pageIdx) => {
          const globalIdx = (page - 1) * ADMIN_PAGE_SIZE + pageIdx;
          const mediaFields = mediaDrafts[row.id] ?? [""];
          return (
            <div
              key={row.id}
              className="rounded-2xl border border-line bg-white/70 p-4 shadow-card sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  #{row.sortOrder}
                  {row.status === "archived" ? " · archived" : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="inline-flex items-center gap-1 text-muted">
                    Move to
                    <input
                      type="number"
                      min={1}
                      max={sortedRows.length}
                      defaultValue={globalIdx + 1}
                      key={`${row.id}-${globalIdx + 1}`}
                      className="w-14 rounded-lg border border-line px-2 py-1 text-ink"
                      onBlur={(e) => {
                        const v = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(v) && v !== globalIdx + 1) {
                          moveToPosition(globalIdx, v);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <label className="mt-4 block text-xs">
                <span className="font-semibold uppercase tracking-widest text-muted">
                  Slug (share link)
                </span>
                <input
                  value={row.slug}
                  onChange={(e) => patchRow(row.id, { slug: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 font-mono text-sm"
                  placeholder="model-001"
                />
                <p className="mt-1.5 break-all text-[11px] text-muted">
                  https://www.humpbuck.com
                  {wholesaleListingPublicPath(row.slug.trim() || "model-001")}
                </p>
              </label>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block text-xs">
                  <span className="font-semibold uppercase tracking-widest text-muted">
                    Model number
                  </span>
                  <input
                    value={row.modelNumber}
                    onChange={(e) => patchRow(row.id, { modelNumber: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm"
                    placeholder="e.g. RM-M04-001"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-semibold uppercase tracking-widest text-muted">
                    Price (USD)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(row.priceUsd) ? row.priceUsd : 0}
                    onChange={(e) =>
                      patchRow(row.id, { priceUsd: Number.parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="mt-4 block text-xs">
                <span className="font-semibold uppercase tracking-widest text-muted">
                  Description
                </span>
                <textarea
                  value={row.description}
                  onChange={(e) => patchRow(row.id, { description: e.target.value })}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm"
                  placeholder="Short wholesale description shown on the card and in the popup."
                />
              </label>
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Media URLs (R2)
                  </span>
                  <button
                    type="button"
                    onClick={() => addMediaUrlField(row.id)}
                    disabled={mediaFields.length >= 24}
                    className="text-[11px] font-semibold uppercase tracking-widest text-ink/70 underline-offset-2 hover:underline disabled:opacity-40"
                  >
                    + Add URL
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {mediaFields.map((url, mediaIdx) => (
                    <div key={`${row.id}-media-${mediaIdx}`} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setMediaUrlAt(row.id, mediaIdx, e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 font-mono text-[12px]"
                        placeholder={
                          mediaIdx === 0
                            ? "https://pub-….r2.dev/…/photo.webp"
                            : "https://pub-….r2.dev/…/clip.mp4"
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeMediaUrlField(row.id, mediaIdx)}
                        className="shrink-0 rounded-xl border border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted hover:text-rose-700"
                        aria-label="Remove URL field"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-muted">
                  <select
                    value={row.status}
                    onChange={(e) => patchRow(row.id, { status: e.target.value })}
                    className="rounded-lg border border-line px-2 py-1 text-ink"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void saveRow(row)}
                  className="rounded-full bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-paper disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void deleteRow(row)}
                  className="rounded-full border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-line bg-paper px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm tabular-nums text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-line bg-paper px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/85 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
