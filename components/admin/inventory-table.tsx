"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  productSlug: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  lowStockThreshold: number;
  hasRecord: boolean;
};

export function InventoryTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [edits, setEdits] = useState<
    Record<string, { quantity: string; lowStockThreshold: string }>
  >({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  const key = (r: Row) => `${r.productSlug}::${r.variantId}`;

  function handleChange(
    r: Row,
    field: "quantity" | "lowStockThreshold",
    value: string,
  ) {
    const k = key(r);
    setEdits((prev) => ({
      ...prev,
      [k]: {
        quantity:
          field === "quantity"
            ? value
            : (prev[k]?.quantity ?? String(r.quantity === -1 ? "" : r.quantity)),
        lowStockThreshold:
          field === "lowStockThreshold"
            ? value
            : (prev[k]?.lowStockThreshold ?? String(r.lowStockThreshold)),
      },
    }));
  }

  async function saveRow(r: Row) {
    const k = key(r);
    const edit = edits[k];
    if (!edit) return;

    const qty = parseInt(edit.quantity, 10);
    if (isNaN(qty) || qty < 0) {
      setMessage("Quantity must be a non-negative number.");
      return;
    }
    const threshold = parseInt(edit.lowStockThreshold, 10);

    setSaving((prev) => new Set(prev).add(k));
    setMessage("");

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: r.productSlug,
          variantId: r.variantId,
          quantity: qty,
          lowStockThreshold: isNaN(threshold) ? 5 : threshold,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to save");
      } else {
        setMessage(`Saved ${r.productName}${r.variantLabel ? ` — ${r.variantLabel}` : ""}`);
        setEdits((prev) => {
          const next = { ...prev };
          delete next[k];
          return next;
        });
        startTransition(() => router.refresh());
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    }
  }

  async function saveAll() {
    const updates = Object.entries(edits)
      .filter(([, v]) => v.quantity !== "")
      .map(([k, v]) => {
        const [productSlug, variantId] = k.split("::");
        return {
          productSlug,
          variantId: variantId || "",
          quantity: Math.max(0, parseInt(v.quantity, 10) || 0),
          lowStockThreshold: Math.max(0, parseInt(v.lowStockThreshold, 10) || 5),
        };
      });

    if (updates.length === 0) {
      setMessage("No changes to save.");
      return;
    }

    setSaving(new Set(updates.map((u) => `${u.productSlug}::${u.variantId}`)));
    setMessage("");

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to save");
      } else {
        setMessage(`Saved ${updates.length} item(s).`);
        setEdits({});
        startTransition(() => router.refresh());
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(new Set());
    }
  }

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div>
      {message && (
        <p className="mb-4 text-sm text-ink/80">{message}</p>
      )}

      {hasEdits && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={saveAll}
            disabled={isPending || saving.size > 0}
            className="rounded-xl bg-ink px-5 py-2 text-xs font-bold uppercase tracking-widest text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            Save all changes ({Object.keys(edits).length})
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-[800px] w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-white/60 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">Low stock alert</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = key(r);
              const edit = edits[k];
              const qty = edit
                ? parseInt(edit.quantity, 10)
                : r.quantity;
              const threshold = edit
                ? parseInt(edit.lowStockThreshold, 10)
                : r.lowStockThreshold;
              const isSaving = saving.has(k);

              let status: { label: string; color: string };
              if (!r.hasRecord && !edit) {
                status = { label: "Unlimited", color: "text-sky-700 bg-sky-50" };
              } else if (qty === 0 || (edit && edit.quantity === "0")) {
                status = { label: "Out of stock", color: "text-red-700 bg-red-50" };
              } else if (!isNaN(qty) && !isNaN(threshold) && qty <= threshold) {
                status = { label: "Low stock", color: "text-amber-700 bg-amber-50" };
              } else {
                status = { label: "In stock", color: "text-emerald-700 bg-emerald-50" };
              }

              return (
                <tr
                  key={k}
                  className="border-b border-line/50 last:border-0 hover:bg-white/40"
                >
                  <td className="px-4 py-3 font-medium">{r.productName}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.variantLabel || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      className="w-20 rounded-lg border border-line bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-ink/30"
                      value={
                        edit
                          ? edit.quantity
                          : r.hasRecord
                            ? String(r.quantity)
                            : ""
                      }
                      placeholder="∞"
                      onChange={(e) =>
                        handleChange(r, "quantity", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      className="w-20 rounded-lg border border-line bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-ink/30"
                      value={
                        edit
                          ? edit.lowStockThreshold
                          : String(r.lowStockThreshold)
                      }
                      onChange={(e) =>
                        handleChange(r, "lowStockThreshold", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {edit && (
                      <button
                        onClick={() => saveRow(r)}
                        disabled={isSaving}
                        className="rounded-lg bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-paper transition hover:bg-ink/90 disabled:opacity-50"
                      >
                        {isSaving ? "…" : "Save"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
