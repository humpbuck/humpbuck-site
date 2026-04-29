"use client";

import { useState } from "react";
import type {
  VideoAspectRatio,
  VideoTutorialProductOption,
} from "@/lib/video-tutorials";

type TutorialRow = {
  productSlug: string;
  title: string;
  url: string;
  aspectRatio: VideoAspectRatio;
  sortOrder: number;
};

const RATIOS: VideoAspectRatio[] = ["16:9", "1:1", "9:16"];

export function VideoTutorialManager({
  initialRows,
  products,
}: {
  initialRows: TutorialRow[];
  products: VideoTutorialProductOption[];
}) {
  const [rows, setRows] = useState<TutorialRow[]>(initialRows);
  const [message, setMessage] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);

  async function saveRow(row: TutorialRow) {
    setBusySlug(row.productSlug);
    setMessage("");
    const res = await fetch("/api/admin/video-tutorials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      setMessage("Save failed");
      setBusySlug(null);
      return;
    }
    setMessage(`Saved ${row.productSlug}`);
    setBusySlug(null);
  }

  async function saveOrder(nextRows: TutorialRow[]) {
    const res = await fetch("/api/admin/video-tutorials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderedProductSlugs: nextRows.map((x) => x.productSlug),
      }),
    });
    if (!res.ok) {
      setMessage("Order save failed");
      return;
    }
    setMessage("Order updated");
  }

  async function deleteRow(productSlug: string) {
    setBusySlug(productSlug);
    setMessage("");
    const res = await fetch("/api/admin/video-tutorials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug }),
    });
    if (!res.ok) {
      setMessage("Delete failed");
      setBusySlug(null);
      return;
    }
    setRows((prev) => prev.filter((x) => x.productSlug !== productSlug));
    setMessage(`Deleted ${productSlug}`);
    setBusySlug(null);
  }

  function addRow() {
    const candidate = products.find(
      (p) => !rows.some((row) => row.productSlug === p.slug),
    );
    if (!candidate) {
      setMessage("No remaining products to add.");
      return;
    }
    setRows((prev) => [
      {
        productSlug: candidate.slug,
        title: `${candidate.name} video tutorial`,
        url: "",
        aspectRatio: "9:16",
        sortOrder: 1,
      },
      ...prev.map((x) => ({ ...x, sortOrder: x.sortOrder + 1 })),
    ]);
    setMessage("");
  }

  function moveToPosition(idx: number, position1Based: number) {
    const clamped = Math.max(1, Math.min(rows.length, position1Based));
    const next = [...rows];
    const [picked] = next.splice(idx, 1);
    next.splice(clamped - 1, 0, picked);
    const normalized = next.map((row, i) => ({ ...row, sortOrder: i + 1 }));
    setRows(normalized);
    void saveOrder(normalized);
  }

  return (
    <div>
      {message ? (
        <p className="mb-4 rounded-xl border border-line bg-white/60 px-3 py-2 text-sm text-muted">
          {message}
        </p>
      ) : null}
      <div className="mb-4">
        <button
          type="button"
          onClick={addRow}
          className="rounded-xl border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/85 hover:bg-paper"
        >
          Add tutorial
        </button>
      </div>
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div key={`${row.productSlug}-${idx}`} className="rounded-2xl border border-line bg-white/60 p-4">
            <div className="mt-3 grid gap-3 sm:grid-cols-12">
              <select
                value={row.productSlug}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, productSlug: e.target.value } : x)),
                  )
                }
                className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
              >
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.slug}
                  </option>
                ))}
              </select>
              <input
                value={row.title}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                  )
                }
                className="sm:col-span-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                placeholder="Tutorial title"
              />
              <input
                value={row.url}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)),
                  )
                }
                className="sm:col-span-4 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                placeholder="https://..."
              />
              <select
                value={row.aspectRatio}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, aspectRatio: e.target.value as VideoAspectRatio } : x,
                    ),
                  )
                }
                className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
              >
                {RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
              <select
                value={row.sortOrder}
                onChange={(e) => moveToPosition(idx, Number(e.target.value))}
                className="sm:col-span-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
              >
                {rows.map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    #{i + 1}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="button"
                  disabled={busySlug === row.productSlug}
                  onClick={() => void saveRow(row)}
                  className="flex-1 rounded-xl bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={busySlug === row.productSlug}
                  onClick={() => void deleteRow(row.productSlug)}
                  className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
