"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewModerationButtons({
  reviewId,
  status,
}: {
  reviewId: string;
  status: "pending" | "approved" | "rejected";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function setStatus(next: "approved" | "rejected") {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not update review.");
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {status === "pending" ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("approved")}
            className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("rejected")}
            className="rounded-full border border-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            status === "approved"
              ? "bg-emerald-100 text-emerald-900"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      )}
      {err ? <p className="max-w-[180px] text-right text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
