"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  blogPostPublicPath,
  normalizeBlogPostSlug,
  type BlogPostRow,
} from "@/lib/blog-post-shared";
import { BlogBodyEditor, type BlogBodyEditorHandle } from "@/components/admin/blog-body-editor";

const ADMIN_PAGE_SIZE = 5;

type DraftRow = BlogPostRow & { isNew?: boolean };

function parsePostRow(post: BlogPostRow): DraftRow {
  return {
    ...post,
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    createdAt: new Date(post.createdAt),
    updatedAt: new Date(post.updatedAt),
  };
}

function emptyRow(sortOrder: number): DraftRow {
  return {
    id: `new-${Date.now()}`,
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    coverImageUrl: "",
    homeCarouselSlot: null,
    homeCarouselImageUrl: "",
    homeCarouselDescription: "",
    status: "draft",
    sortOrder,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isNew: true,
  };
}

export function BlogArticleManager({ initialRows }: { initialRows: BlogPostRow[] }) {
  const [rows, setRows] = useState<DraftRow[]>(() => initialRows.map(parsePostRow));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("info");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const editorRefs = useRef<Map<string, BlogBodyEditorHandle>>(new Map());
  const messageRef = useRef<HTMLParagraphElement>(null);

  function showMessage(text: string, tone: "info" | "success" | "error" = "info") {
    setMessage(text);
    setMessageTone(tone);
    requestAnimationFrame(() => {
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandRow(id: string) {
    setExpandedIds((prev) => new Set(prev).add(id));
  }

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() ||
          a.sortOrder - b.sortOrder ||
          a.title.localeCompare(b.title),
      ),
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ADMIN_PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  async function reloadRows() {
    const res = await fetch("/api/admin/blog-posts", { credentials: "same-origin" });
    const data = (await res.json().catch(() => ({}))) as {
      posts?: BlogPostRow[];
      error?: string;
    };
    if (!res.ok || !Array.isArray(data.posts)) {
      showMessage(data.error ?? "Could not reload articles from the server.", "error");
      return;
    }
    setRows((prev) => {
      const drafts = prev.filter((row) => row.isNew);
      return [...drafts, ...data.posts!.map(parsePostRow)];
    });
    showMessage(
      data.posts.length === 0
        ? "No saved articles in the database."
        : `Loaded ${data.posts.length} article${data.posts.length === 1 ? "" : "s"}.`,
      "info",
    );
  }

  const pageRows = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE;
    return sortedRows.slice(start, start + ADMIN_PAGE_SIZE);
  }, [page, sortedRows]);

  async function saveRow(row: DraftRow) {
    const flushedBody = editorRefs.current.get(row.id)?.flushMarkup() ?? row.body;
    const rowToSave = { ...row, body: flushedBody };

    if (!rowToSave.title.trim()) {
      showMessage("Title is required before saving.", "error");
      return;
    }
    if (!rowToSave.body.trim()) {
      showMessage(
        "Body is required. Type in the editor, then click Save again.",
        "error",
      );
      return;
    }
    if (
      rowToSave.homeCarouselSlot != null &&
      !rowToSave.homeCarouselImageUrl.trim() &&
      !rowToSave.coverImageUrl.trim()
    ) {
      showMessage(
        "Homepage carousel needs a homepage image URL or a cover image URL when a carousel slot is selected.",
        "error",
      );
      return;
    }

    setBusyId(row.id);
    setMessage("");
    const payload = {
      slug: rowToSave.slug || normalizeBlogPostSlug(rowToSave.title),
      title: rowToSave.title,
      excerpt: rowToSave.excerpt,
      body: rowToSave.body,
      coverImageUrl: rowToSave.coverImageUrl,
      homeCarouselSlot: rowToSave.homeCarouselSlot,
      homeCarouselImageUrl: rowToSave.homeCarouselImageUrl,
      homeCarouselDescription: rowToSave.homeCarouselDescription,
      status: rowToSave.status,
      sortOrder: rowToSave.sortOrder,
    };
    try {
      const res = rowToSave.isNew
        ? await fetch("/api/admin/blog-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/blog-posts/${encodeURIComponent(rowToSave.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = (await res.json().catch(() => ({}))) as {
        post?: BlogPostRow;
        error?: string;
      };
      if (!res.ok || !data.post) {
        showMessage(data.error ?? "Save failed. Check the fields and try again.", "error");
        setBusyId(null);
        return;
      }
      const saved = parsePostRow(data.post);
      setRows((prev) => {
        const drafts = prev.filter((r) => r.isNew && r.id !== rowToSave.id);
        const others = prev.filter((r) => !r.isNew && r.id !== saved.id);
        return [saved, ...drafts, ...others];
      });
      showMessage(`Saved "${saved.title}". It is stored in the database.`, "success");
      setBusyId(null);
      setPage(1);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(rowToSave.id);
        next.add(saved.id);
        return next;
      });
    } catch {
      showMessage("Save failed — network error. Check your connection and try again.", "error");
      setBusyId(null);
    }
  }

  async function deleteRow(row: DraftRow) {
    if (row.isNew) {
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      return;
    }
    const typed = window.prompt(
      `Delete "${row.title}" permanently?\n\nType DELETE to confirm.`,
    );
    if (typed !== "DELETE") return;
    setBusyId(row.id);
    setMessage("");
    const res = await fetch(`/api/admin/blog-posts/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      showMessage("Delete failed", "error");
      setBusyId(null);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== row.id));
    showMessage("Deleted.", "success");
    setBusyId(null);
  }

  async function saveOrder(nextRows: DraftRow[]) {
    const persisted = nextRows.filter((x) => !x.isNew);
    if (persisted.length === 0) return;
    if (!window.confirm("Update display order on the blog page?")) return;
    const res = await fetch("/api/admin/blog-posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: persisted.map((x) => x.id) }),
    });
    if (!res.ok) {
      showMessage("Order save failed", "error");
      return;
    }
    showMessage("Order updated.", "success");
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
    const maxOrder = sortedRows.reduce((max, row) => Math.max(max, row.sortOrder), 0);
    const draft = emptyRow(maxOrder + 1);
    setRows((prev) => [draft, ...prev]);
    expandRow(draft.id);
    setPage(1);
    setMessage("");
  }

  return (
    <div>
      {message ? (
        <p
          ref={messageRef}
          role="status"
          className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : messageTone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-line bg-white/60 text-muted"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-xl border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/85 hover:bg-paper"
        >
          New article
        </button>
        <button
          type="button"
          onClick={() => void reloadRows()}
          className="rounded-xl border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/85 hover:bg-paper"
        >
          Reload list
        </button>
        <p className="text-xs text-muted">
          {sortedRows.length} article{sortedRows.length === 1 ? "" : "s"} total · {ADMIN_PAGE_SIZE}{" "}
          per page · newest first. Click a row to expand. Set status to <strong>Published</strong>{" "}
          to show on the storefront blog.
        </p>
      </div>

      <div className="space-y-4">
        {pageRows.map((row) => {
          const globalIdx = sortedRows.findIndex((x) => x.id === row.id);
          const expanded = expandedIds.has(row.id);
          return (
            <div
              key={row.id}
              className="rounded-2xl border border-line bg-white/60 p-4 sm:p-5"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(row.id)}
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={expanded}
              >
                <ChevronDown
                  size={18}
                  className={`mt-0.5 shrink-0 text-muted transition ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {row.title.trim() || "Untitled article"}
                    {row.isNew ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-digital-dim">
                        New
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span
                      className={
                        row.status === "published"
                          ? "font-semibold text-ink/80"
                          : undefined
                      }
                    >
                      {row.status === "published" ? "Published" : "Draft"}
                    </span>
                    {row.slug.trim() ? <span>{row.slug}</span> : null}
                    <span>Order {row.sortOrder}</span>
                    {row.homeCarouselSlot ? (
                      <span>Home carousel {row.homeCarouselSlot}</span>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {expanded ? "Collapse" : "Expand"}
                </span>
              </button>

              {expanded ? (
                <div className="mt-4 border-t border-line pt-4">
              <div className="grid gap-3 sm:grid-cols-12">
                <input
                  value={row.slug}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === row.id ? { ...x, slug: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="slug (e.g. eastern-energy)"
                  className="sm:col-span-3 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                />
                <input
                  value={row.title}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === row.id ? { ...x, title: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Title"
                  className="sm:col-span-5 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                />
                <select
                  value={row.status}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === row.id
                          ? {
                              ...x,
                              status: e.target.value === "published" ? "published" : "draft",
                            }
                          : x,
                      ),
                    )
                  }
                  className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={row.sortOrder}
                  onChange={(e) => {
                    const sortOrder = Number.parseInt(e.target.value, 10) || 1;
                    setRows((prev) =>
                      prev.map((x) => (x.id === row.id ? { ...x, sortOrder } : x)),
                    );
                  }}
                  onBlur={(e) => {
                    const sortOrder = Number.parseInt(e.target.value, 10) || 1;
                    moveToPosition(globalIdx, sortOrder);
                  }}
                  className="sm:col-span-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  aria-label="Display order"
                />
              </div>

              <input
                value={row.coverImageUrl}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x) =>
                      x.id === row.id ? { ...x, coverImageUrl: e.target.value } : x,
                    ),
                  )
                }
                placeholder="Cover image URL (R2 or HTTPS — keeps original aspect ratio)"
                className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />

              <textarea
                value={row.excerpt}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x) =>
                      x.id === row.id ? { ...x, excerpt: e.target.value } : x,
                    ),
                  )
                }
                placeholder="Short excerpt for the blog index card"
                rows={2}
                className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-12">
                <select
                  value={row.homeCarouselSlot?.toString() ?? ""}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === row.id
                          ? {
                              ...x,
                              homeCarouselSlot: e.target.value
                                ? Number.parseInt(e.target.value, 10)
                                : null,
                            }
                          : x,
                      ),
                    )
                  }
                  className="sm:col-span-3 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                >
                  <option value="">Not in homepage carousel</option>
                  <option value="1">Homepage carousel 1</option>
                  <option value="2">Homepage carousel 2</option>
                  <option value="3">Homepage carousel 3</option>
                  <option value="4">Homepage carousel 4</option>
                  <option value="5">Homepage carousel 5</option>
                  <option value="6">Homepage carousel 6</option>
                </select>

                <input
                  value={row.homeCarouselImageUrl}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === row.id
                          ? { ...x, homeCarouselImageUrl: e.target.value }
                          : x,
                      ),
                    )
                  }
                  placeholder="Homepage carousel image URL (R2 or HTTPS)"
                  className="sm:col-span-9 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-12">
                <input
                  value={row.homeCarouselDescription}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === row.id
                          ? { ...x, homeCarouselDescription: e.target.value }
                          : x,
                      ),
                    )
                  }
                  placeholder="Homepage carousel text under the image"
                  className="sm:col-span-12 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                To show this article on the homepage carousel, set a slot from 1 to 6, add a
                homepage image URL (or reuse the cover image), and keep the post{" "}
                <strong>Published</strong>. The homepage shows up to six blog articles in slot
                order. If two posts use the same slot, the most recently updated one wins.
              </p>

              <BlogBodyEditor
                ref={(handle) => {
                  if (handle) editorRefs.current.set(row.id, handle);
                  else editorRefs.current.delete(row.id);
                }}
                value={row.body}
                onChange={(body) =>
                  setRows((prev) =>
                    prev.map((x) => (x.id === row.id ? { ...x, body } : x)),
                  )
                }
              />
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Select text, then use <strong>Bold</strong>, <strong>Font</strong>, or{" "}
                <strong>Color</strong> — formatting shows directly in the editor. Press Enter for a
                new paragraph. Save, then preview on the storefront.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void saveRow(row)}
                  className="rounded-xl bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
                >
                  {busyId === row.id ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void deleteRow(row)}
                  className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                >
                  Delete
                </button>
                {!row.isNew && row.status === "published" ? (
                  <a
                    href={blogPostPublicPath(row.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold uppercase tracking-[0.12em] text-digital-dim underline-offset-4 hover:underline"
                  >
                    View on site
                  </a>
                ) : null}
              </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {sortedRows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white/60 px-4 py-5 text-sm text-muted">
          No articles in the list yet. Click <strong>New article</strong>, fill in title and body,
          then <strong>Save</strong>. After saving you should see a green confirmation message and
          the article card above. If you previously saved posts but see zero here, click{" "}
          <strong>Reload list</strong> or check whether <strong>Delete</strong> was clicked by
          mistake (deletes are permanent).
        </p>
      ) : null}

      {sortedRows.length > ADMIN_PAGE_SIZE ? (
        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-line bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages} · showing{" "}
            {Math.min(sortedRows.length, (page - 1) * ADMIN_PAGE_SIZE + 1)}–
            {Math.min(page * ADMIN_PAGE_SIZE, sortedRows.length)} of {sortedRows.length}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-line bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
