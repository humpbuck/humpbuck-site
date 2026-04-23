"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteReviewButton({
  reviewId,
  label,
}: {
  reviewId: string;
  /** Short hint for confirm dialog, e.g. product name */
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    if (
      !confirm(
        `Delete this review (${label})? It will disappear from the product page. R2 review photos (if any) are not removed automatically.`,
      )
    ) {
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErr(data.error || "Delete failed");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {err ? (
        <p className="max-w-[200px] text-right text-xs text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={onDelete}
        className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-900 transition hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "…" : "Delete"}
      </button>
    </div>
  );
}
