"use client";

import { useState } from "react";
import type { VideoAspectRatio } from "@/lib/video-tutorials";

type TutorialRow = {
  productSlug: string;
  title: string;
  url: string;
  aspectRatio: VideoAspectRatio;
};

const RATIOS: VideoAspectRatio[] = ["16:9", "1:1", "9:16"];

export function VideoTutorialManager({ initialRows }: { initialRows: TutorialRow[] }) {
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

  return (
    <div>
      {message ? (
        <p className="mb-4 rounded-xl border border-line bg-white/60 px-3 py-2 text-sm text-muted">
          {message}
        </p>
      ) : null}
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.productSlug} className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {row.productSlug}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-12">
              <input
                value={row.title}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                  )
                }
                className="sm:col-span-3 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                placeholder="Tutorial title"
              />
              <input
                value={row.url}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)),
                  )
                }
                className="sm:col-span-6 rounded-xl border border-line bg-white px-3 py-2 text-sm"
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
              <button
                type="button"
                disabled={busySlug === row.productSlug}
                onClick={() => void saveRow(row)}
                className="sm:col-span-1 rounded-xl bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
