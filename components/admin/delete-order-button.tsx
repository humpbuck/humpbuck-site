"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    if (
      !confirm(
        "Delete this order permanently? This cannot be undone.",
      )
    ) {
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErr(data.error || "Delete failed");
        setLoading(false);
        return;
      }
      router.push("/admin/orders");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 border-t border-line pt-10">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-800/90">
        Danger zone
      </h3>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Remove this order from the database. Use for test orders or mistaken
        entries only.
      </p>
      {err && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {err}
        </p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={onDelete}
        className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-red-900 transition hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete order"}
      </button>
    </div>
  );
}
