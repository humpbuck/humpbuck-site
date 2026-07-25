"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  blogPostPublicPath,
  normalizeBlogPostSlug,
  type BlogPostRow,
} from "@/lib/blog-post-shared";

const AdminBlogEditor = dynamic(
  () =>
    import("@/components/admin/admin-blog-editor").then((m) => m.AdminBlogEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-8 text-center text-sm text-zinc-500">
        Loading editor…
      </div>
    ),
  },
);

type AdminProductOption = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  body: string;
  productIds: string[];
  published: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  coverImageUrl: "",
  body: "",
  productIds: [],
  published: false,
};

function parsePostRow(post: BlogPostRow): BlogPostRow {
  return {
    ...post,
    productIds: Array.isArray(post.productIds) ? post.productIds : [],
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    createdAt: new Date(post.createdAt),
    updatedAt: new Date(post.updatedAt),
  };
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function BlogArticleManager({ initialRows }: { initialRows: BlogPostRow[] }) {
  const [posts, setPosts] = useState<BlogPostRow[]>(() =>
    initialRows.map(parsePostRow),
  );
  const [products, setProducts] = useState<AdminProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productPick, setProductPick] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const productMap = useMemo(() => {
    const map = new Map<string, AdminProductOption>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const availableProducts = useMemo(
    () => products.filter((p) => !form.productIds.includes(p.id)),
    [products, form.productIds],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [postsRes, productsRes] = await Promise.all([
        fetch("/api/admin/blog-posts", { credentials: "same-origin" }),
        fetch("/api/admin/products", { credentials: "same-origin" }),
      ]);
      const postsData = (await postsRes.json().catch(() => ({}))) as {
        posts?: BlogPostRow[];
        error?: string;
      };
      const productsData = (await productsRes.json().catch(() => ({}))) as {
        products?: AdminProductOption[];
        error?: string;
      };
      if (!postsRes.ok) throw new Error(postsData.error ?? "Failed to load posts");
      if (!productsRes.ok) {
        throw new Error(productsData.error ?? "Failed to load products");
      }
      setPosts((postsData.posts ?? []).map(parsePostRow));
      setProducts(
        (productsData.products ?? []).map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          status: p.status,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setProductPick("");
    setSlugTouched(false);
  }

  function startEdit(post: BlogPostRow) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      coverImageUrl: post.coverImageUrl ?? "",
      body: post.body ?? "",
      productIds: Array.isArray(post.productIds) ? post.productIds : [],
      published: post.status === "published",
    });
    setSlugTouched(true);
    setProductPick("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : normalizeBlogPostSlug(title),
    }));
  }

  function addProduct() {
    const id = productPick.trim();
    if (!id) return;
    if (form.productIds.includes(id)) return;
    setForm((prev) => ({ ...prev, productIds: [...prev.productIds, id] }));
    setProductPick("");
  }

  function removeProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((pid) => pid !== id),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      slug: form.slug || normalizeBlogPostSlug(form.title),
      excerpt: form.excerpt,
      coverImageUrl: form.coverImageUrl,
      body: form.body,
      productIds: form.productIds,
      status: form.published ? "published" : "draft",
      sortOrder: 0,
    };
    try {
      const res = await fetch(
        editingId
          ? `/api/admin/blog-posts/${encodeURIComponent(editingId)}`
          : "/api/admin/blog-posts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/blog-posts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            {editingId ? `Edit post` : "New post"}
          </h3>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-zinc-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="Factory tips for wholesale buyers"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Slug (URL)</span>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
              placeholder="factory-tips"
            />
            <span className="mt-1 block text-xs text-zinc-400">
              /blog/{form.slug || "…"}
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">
              Cover image R2 URL
            </span>
            <input
              value={form.coverImageUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="https://assets.humpbuck.com/…"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-zinc-700">Excerpt</span>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="Short summary shown on the blog list"
            />
          </label>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Body</span>
          <AdminBlogEditor
            value={form.body}
            onChange={(html) => setForm((prev) => ({ ...prev, body: html }))}
          />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-zinc-700">Related products</span>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[16rem] flex-1 text-sm">
              <span className="mb-1 block text-xs text-zinc-500">Select product</span>
              <select
                value={productPick}
                onChange={(e) => setProductPick(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              >
                <option value="">Choose a product…</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.status === "active" ? "" : ` (${p.status})`}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addProduct}
              disabled={!productPick}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-40"
            >
              Add product
            </button>
          </div>
          {form.productIds.length > 0 ? (
            <ul className="space-y-1">
              {form.productIds.map((id) => {
                const product = productMap.get(id);
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-zinc-800">
                      {product ? product.name : `Product ${id.slice(0, 8)}…`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(id)}
                      className="shrink-0 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400">No products attached yet.</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, published: e.target.checked }))
            }
            className="rounded border-zinc-300"
          />
          Published (visible on /blog)
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Update post" : "Create post"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">All posts</h3>
        {loading && posts.length === 0 ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            No blog posts yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{post.title}</p>
                      <p className="font-mono text-xs text-zinc-400">
                        /blog/{post.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.status === "published"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatDate(post.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Edit
                        </button>
                        {post.status === "published" ? (
                          <a
                            href={blogPostPublicPath(post.slug)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-amber-700 hover:text-amber-900"
                          >
                            View
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDelete(post.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
