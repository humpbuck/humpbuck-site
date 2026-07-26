"use client";

import { useCallback, useEffect, useState } from "react";

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
};

function CategoryImagePreview({ url }: { url: string }) {
  const src = url.trim();
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin paste-URL preview
    <img
      src={src}
      alt=""
      className="size-12 rounded-lg border border-line object-cover"
    />
  );
}

export function AdminCategoriesPanel() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories");
      const data = (await res.json()) as {
        categories?: ProductCategory[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load series");
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load series");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(category: ProductCategory) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditImageUrl(category.imageUrl ?? "");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditImageUrl("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          imageUrl: imageUrl.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setName("");
      setImageUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          imageUrl: editImageUrl.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this series? Products in this series will become unassigned.",
      )
    ) {
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      if (editingId === id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    if (editingId !== null) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDraggingIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnd() {
    setDraggingIndex(null);
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setDraggingIndex(null);
    if (editingId !== null) return;

    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(fromIndex) || fromIndex === dropIndex) return;

    const previous = categories;
    const next = [...categories];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(dropIndex, 0, moved);
    setCategories(next);
    setError("");

    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((c) => c.id) }),
      });
      const data = (await res.json()) as {
        categories?: ProductCategory[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Reorder failed");
      setCategories(data.categories ?? next);
    } catch (err) {
      setCategories(previous);
      setError(err instanceof Error ? err.message : "Reorder failed");
    }
  }

  return (
    <div className="mt-8 max-w-2xl">
      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-2xl border border-line bg-white/50 p-5"
      >
        <h2 className="font-serif text-xl tracking-tight">Add series</h2>
        <p className="text-[11px] leading-relaxed text-muted">
          Create a series, then assign it on Products. Drag the list below to set
          PRODUCTS menu order (after All products). Optional 1:1 image shows in the
          PRODUCTS dropdown.
        </p>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ANA-DIGI, Ultra-thin, Automatic…"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Image URL (1:1 R2)
          </span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://assets.humpbuck.com/…"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
          />
          <span className="mt-1 block text-[11px] text-muted">
            Square crop recommended. Paste the public R2 URL after uploading.
          </span>
          {imageUrl.trim() ? (
            <div className="mt-2">
              <CategoryImagePreview url={imageUrl} />
            </div>
          ) : null}
        </label>
        {error && !editingId ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-lg bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add series"}
        </button>
      </form>

      <div className="mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl tracking-tight">All series</h2>
          {categories.length > 1 ? (
            <span className="text-[11px] text-muted">Drag to reorder</span>
          ) : null}
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No series yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white/50">
            {categories.map((category, index) => (
              <li
                key={category.id}
                draggable={categories.length > 1 && editingId === null}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={(e) => void handleDrop(e, index)}
                className={`px-4 py-3 transition-colors ${
                  draggingIndex === index ? "bg-paper/80 opacity-60" : ""
                } ${
                  categories.length > 1 && editingId === null
                    ? "cursor-grab active:cursor-grabbing"
                    : ""
                }`}
              >
                {editingId === category.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/25"
                    />
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Image URL (1:1 R2)
                      </span>
                      <input
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="https://assets.humpbuck.com/…"
                        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/25"
                      />
                      {editImageUrl.trim() ? (
                        <div className="mt-2">
                          <CategoryImagePreview url={editImageUrl} />
                        </div>
                      ) : null}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-ink px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-paper disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-widest hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    {categories.length > 1 ? (
                      <span
                        className="shrink-0 select-none px-0.5 text-sm leading-none text-muted/50"
                        aria-hidden
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                    ) : null}
                    {category.imageUrl ? (
                      <CategoryImagePreview url={category.imageUrl} />
                    ) : (
                      <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-[9px] uppercase tracking-wider text-muted/60"
                        aria-hidden
                      >
                        1:1
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{category.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                        {category.slug}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="text-[11px] font-medium text-ink/70 hover:text-ink"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(category.id)}
                        className="text-[11px] font-medium text-red-700 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
