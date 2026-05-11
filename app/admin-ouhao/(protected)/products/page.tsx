"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { adminPath } from "@/lib/admin-path";

export default function AdminProductsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [products, setProducts] = useState<Array<{ id: string; name: string; slug: string; status?: string }>>([]);

  useEffect(() => {
    fetch(adminPath("/api/admin/products"))
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => setProducts([]));
  }, []);

  const visible = useMemo(() => {
    if (statusFilter === "all") return products;
    return products.filter((p) => (p.status ?? "active") === statusFilter);
  }, [products, statusFilter]);

  async function archiveOne(id: string) {
    if (!confirm("Archive this product? It will stop selling but remain in the database.")) return;
    setBusy(id);
    try {
      const res = await fetch(adminPath(`/api/admin/products/${id}`), { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p)));
    } finally {
      setBusy(null);
    }
  }

  async function purgeOne(id: string) {
    if (!confirm("Permanently delete this archived product? This cannot be undone.")) return;
    setBusy(id);
    try {
      const res = await fetch(adminPath(`/api/admin/products/${id}/purge`), { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl tracking-tight">Products</h1>
        <a href={adminPath("/products/new")} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-paper">
          <Plus className="h-4 w-4" /> New product
        </a>
      </div>

      <div className="mt-4 flex gap-2">
        {(["active", "archived", "all"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest ${statusFilter === s ? "border-ink bg-ink text-paper" : "border-line bg-white text-muted"}`}>
            {s === "active" ? "On sale" : s === "archived" ? "Archived" : "All"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {visible.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl border border-line bg-white/60 p-4">
            <div>
              <div className="font-medium text-ink">{p.name}</div>
              <div className="text-xs text-muted">{p.slug} · {(p.status ?? "active")}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => archiveOne(p.id)} disabled={busy === p.id} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-950 disabled:opacity-50">
                Archive / 下架
              </button>
              <button type="button" onClick={() => purgeOne(p.id)} disabled={busy === p.id || (p.status ?? "active") !== "archived"} className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-950 disabled:opacity-50">
                Delete forever
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
