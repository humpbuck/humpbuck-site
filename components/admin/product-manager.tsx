"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type InventoryRecord = {
  productSlug: string;
  variantId: string;
  quantity: number;
  lowStockThreshold: number;
};

type CatalogProductRecord = {
  id: string;
  slug: string;
  name: string;
  seriesSlug: string;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  inStock: boolean;
  highlightsJson: string;
  specsJson: string;
  galleryJson: string;
  detailJson: string;
  variantsJson: string;
  promoVideoJson: string | null;
};

type SpecRow = { label: string; value: string };
type VariantRow = { id: string; label: string; image: string; inStock?: boolean };
type PromoVideo = { src: string; poster?: string } | null;

type EditableProduct = {
  id: string | null;
  slug: string;
  name: string;
  seriesSlug: string;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  image: string;
  inStock: boolean;
  highlights: string[];
  specs: SpecRow[];
  gallery: string[];
  detail: string[];
  variants: VariantRow[];
  promoVideo: PromoVideo;
  inventory: Record<string, { quantity: string; lowStockThreshold: string }>;
};

function parseArray<T>(raw: string, fallback: T[]): T[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function parseVideo(raw: string | null): PromoVideo {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { src?: string; poster?: string };
    if (!v.src) return null;
    return { src: v.src, poster: v.poster || undefined };
  } catch {
    return null;
  }
}

function buildEditableProduct(
  p: CatalogProductRecord,
  inventory: InventoryRecord[],
): EditableProduct {
  const inv = inventory.filter((r) => r.productSlug === p.slug);
  const map: EditableProduct["inventory"] = {};
  for (const row of inv) {
    map[row.variantId] = {
      quantity: String(row.quantity),
      lowStockThreshold: String(row.lowStockThreshold),
    };
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    seriesSlug: p.seriesSlug,
    categoryLabel: p.categoryLabel,
    shortDescription: p.shortDescription,
    description: p.description,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice == null ? "" : String(p.compareAtPrice),
    image: p.image,
    inStock: p.inStock,
    highlights: parseArray<string>(p.highlightsJson, []),
    specs: parseArray<SpecRow>(p.specsJson, []),
    gallery: parseArray<string>(p.galleryJson, []),
    detail: parseArray<string>(p.detailJson, []),
    variants: parseArray<VariantRow>(p.variantsJson, []),
    promoVideo: parseVideo(p.promoVideoJson),
    inventory: map,
  };
}

function newProductDraft(): EditableProduct {
  return {
    id: null,
    slug: "",
    name: "",
    seriesSlug: "digitemp",
    categoryLabel: "Catalog",
    shortDescription: "",
    description: "",
    price: "0",
    compareAtPrice: "",
    image: "",
    inStock: true,
    highlights: [""],
    specs: [{ label: "", value: "" }],
    gallery: [],
    detail: [],
    variants: [{ id: "style-01", label: "Style 01", image: "", inStock: true }],
    promoVideo: null,
    inventory: {
      "style-01": { quantity: "100", lowStockThreshold: "5" },
    },
  };
}

async function validateVideoDimensions(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const ok = video.videoWidth === 720 && video.videoHeight === 1280;
      URL.revokeObjectURL(url);
      resolve(ok);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    video.src = url;
  });
}

function styleNumberFromVariantId(variantId?: string): number | null {
  if (!variantId?.trim()) return null;
  const m = /^style-(\d+)$/i.exec(variantId.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function upsertByIndex(list: string[], oneBasedIndex: number, value: string): string[] {
  const idx = Math.max(0, oneBasedIndex - 1);
  const next = [...list];
  while (next.length < idx) next.push("");
  next[idx] = value;
  return next;
}

function nextIndexedSlot(
  list: string[],
  section: "gallery" | "detail",
): number {
  const re =
    section === "gallery"
      ? /-gallery-(\d+)\.webp(?:\?.*)?$/i
      : /-detail-(\d+)\.webp(?:\?.*)?$/i;
  let max = 0;
  for (const u of list) {
    const m = re.exec(u);
    if (!m) continue;
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  if (max > 0) return max + 1;
  return list.length + 1;
}

export function ProductManager({
  initialProducts,
  initialInventory,
}: {
  initialProducts: CatalogProductRecord[];
  initialInventory: InventoryRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<EditableProduct[]>(
    initialProducts.map((p) => buildEditableProduct(p, initialInventory)),
  );
  const [selected, setSelected] = useState<string | null>(
    initialProducts[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [busy, setBusy] = useState(false);
  const [messageTimer, setMessageTimer] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimer != null) window.clearTimeout(messageTimer);
    };
  }, [messageTimer]);
  const [messageTimer, setMessageTimer] = useState<number | null>(null);

  const current = useMemo(() => {
    if (selected == null) return null;
    return products.find((p) => (p.id ?? "__new__") === selected) ?? null;
  }, [products, selected]);

  function clearMessageTimer() {
    if (messageTimer != null) {
      window.clearTimeout(messageTimer);
      setMessageTimer(null);
    }
  }

  function setFlashMessage(text: string, type: "success" | "error" | "info" = "info") {
    clearMessageTimer();
    setMessage(text);
    setMessageType(type);
    if (type === "success") {
      const id = window.setTimeout(() => {
        setMessage("");
        setMessageTimer(null);
      }, 5000);
      setMessageTimer(id);
    }
  }

  function updateCurrent(mutator: (p: EditableProduct) => EditableProduct) {
    if (!current) return;
    setProducts((prev) =>
      prev.map((p) => {
        const key = p.id ?? "__new__";
        const currKey = current.id ?? "__new__";
        return key === currKey ? mutator(p) : p;
      }),
    );
  }

  function ensureInventoryRow(variantId: string) {
    updateCurrent((p) => {
      if (p.inventory[variantId]) return p;
      return {
        ...p,
        inventory: {
          ...p.inventory,
          [variantId]: { quantity: "100", lowStockThreshold: "5" },
        },
      };
    });
  }

  async function uploadMedia(section: "gallery" | "detail" | "variants" | "video", file: File, variantId?: string) {
    if (!current) return;
    if (section === "video") {
      if (file.type !== "video/mp4") {
        setFlashMessage("Video must be MP4.", "error");
        return;
      }
      const ok = await validateVideoDimensions(file);
      if (!ok) {
        setFlashMessage("Video must be exactly 720x1280.", "error");
        return;
      }
    } else if (file.type !== "image/webp") {
      setFlashMessage("Images must be WEBP.", "error");
      return;
    }

    setBusy(true);
    setFlashMessage("");
    const sortIndex =
      section === "gallery"
        ? nextIndexedSlot(current.gallery, "gallery")
        : section === "detail"
          ? nextIndexedSlot(current.detail, "detail")
          : section === "variants"
            ? styleNumberFromVariantId(variantId) ?? undefined
            : undefined;
    try {
      const presign = await fetch("/api/admin/products/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: current.slug || "draft-product",
          section,
          variantId,
          sortIndex,
          contentType: file.type,
          byteSize: file.size,
        }),
      });
      const payload = (await presign.json()) as {
        uploadUrl?: string;
        publicUrl?: string;
        error?: string;
      };
      if (!presign.ok || !payload.uploadUrl || !payload.publicUrl) {
        setFlashMessage(payload.error || "Failed to get upload URL.", "error");
        return;
      }
      const put = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setFlashMessage("Upload failed.", "error");
        return;
      }

      updateCurrent((p) => {
        if (section === "gallery") {
          return {
            ...p,
            gallery: upsertByIndex(
              p.gallery,
              sortIndex ?? p.gallery.length + 1,
              payload.publicUrl!,
            ),
          };
        }
        if (section === "detail") {
          return {
            ...p,
            detail: upsertByIndex(
              p.detail,
              sortIndex ?? p.detail.length + 1,
              payload.publicUrl!,
            ),
          };
        }
        if (section === "video") {
          return {
            ...p,
            promoVideo: { src: payload.publicUrl!, poster: p.gallery[0] || undefined },
          };
        }
        return {
          ...p,
          variants: p.variants.map((v) =>
            v.id === variantId ? { ...v, image: payload.publicUrl! } : v,
          ),
        };
      });
      setFlashMessage("Uploaded to R2.", "success");
    } catch {
      setFlashMessage("Upload error.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrent() {
    if (!current) return;
    if (!current.slug.trim() || !current.name.trim()) {
      setFlashMessage("Slug and name are required.", "error");
      return;
    }
    setBusy(true);
    setFlashMessage("");
    const payload = {
      slug: current.slug.trim(),
      name: current.name.trim(),
      seriesSlug: current.seriesSlug.trim(),
      categoryLabel: current.categoryLabel.trim(),
      shortDescription: current.shortDescription.trim(),
      description: current.description.trim(),
      price: Number(current.price) || 0,
      compareAtPrice:
        current.compareAtPrice.trim() === ""
          ? null
          : Number(current.compareAtPrice) || null,
      image: current.image.trim(),
      inStock: current.inStock,
      highlights: current.highlights.filter((s) => s.trim()),
      specs: current.specs.filter((s) => s.label.trim() || s.value.trim()),
      gallery: current.gallery.filter((u) => u.trim()),
      detail: current.detail.filter((u) => u.trim()),
      variants: current.variants.map((v) => ({
        id: v.id.trim(),
        label: v.label.trim(),
        image: v.image.trim(),
        inStock: v.inStock !== false,
      })),
      promoVideo: current.promoVideo?.src ? current.promoVideo : null,
      inventory: Object.entries(current.inventory).map(([variantId, row]) => ({
        variantId,
        quantity: Math.max(0, parseInt(row.quantity || "0", 10) || 0),
        lowStockThreshold: Math.max(
          0,
          parseInt(row.lowStockThreshold || "5", 10) || 5,
        ),
      })),
    };

    try {
      const res = await fetch(
        current.id ? `/api/admin/products/${current.id}` : "/api/admin/products",
        {
          method: current.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok) {
        setFlashMessage(data.error || "Save failed.", "error");
        return;
      }
      if (!current.id && data.id) {
        setProducts((prev) =>
          prev.map((p) => {
            if ((p.id ?? "__new__") !== "__new__") return p;
            if (p.slug !== current.slug) return p;
            return { ...p, id: data.id! };
          }),
        );
        setSelected(data.id);
      }
      setFlashMessage("✅ Saved successfully.", "success");
      startTransition(() => router.refresh());
    } catch {
      setFlashMessage("Save failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrent() {
    if (!current) return;
    if (!current.id) {
      setProducts((prev) => prev.filter((p) => p !== current));
      setSelected(products[0]?.id ?? null);
      return;
    }
    if (!window.confirm(`Delete product ${current.slug}?`)) return;
    setBusy(true);
    setFlashMessage("");
    try {
      const res = await fetch(`/api/admin/products/${current.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setFlashMessage(data.error || "Delete failed.", "error");
        return;
      }
      setFlashMessage("Deleted.", "success");
      startTransition(() => router.refresh());
    } catch {
      setFlashMessage("Delete failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-line bg-white/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Products
          </p>
          <button
            type="button"
            onClick={() => {
              const draft = newProductDraft();
              setProducts((prev) => [draft, ...prev]);
              setSelected("__new__");
            }}
            className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {products.map((p, idx) => {
            const key = p.id ?? "__new__";
            const active = key === selected;
            return (
              <button
                type="button"
                key={`${key}-${idx}`}
                onClick={() => setSelected(key)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-ink/30 bg-white"
                    : "border-line bg-white/60 hover:border-ink/15"
                }`}
              >
                <p className="truncate text-xs font-semibold text-ink">{p.name || "(New product)"}</p>
                <p className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-muted">
                  {p.slug || "draft-slug"}
                </p>
              </button>
            );
          })}
          {products.length === 0 && (
            <p className="text-xs text-muted">No products yet. Click Add.</p>
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-line bg-white/50 p-5">
        {!current ? (
          <p className="text-sm text-muted">Select or create a product.</p>
        ) : (
          <div className="space-y-6">
            {message && (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : messageType === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-line bg-white/70 text-ink/80"
                }`}
              >
                {message}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledInput
                label="Slug"
                value={current.slug}
                onChange={(v) => updateCurrent((p) => ({ ...p, slug: v }))}
              />
              <LabeledInput
                label="Name"
                value={current.name}
                onChange={(v) => updateCurrent((p) => ({ ...p, name: v }))}
              />
              <LabeledInput
                label="Series slug"
                value={current.seriesSlug}
                onChange={(v) => updateCurrent((p) => ({ ...p, seriesSlug: v }))}
              />
              <LabeledInput
                label="Category label"
                value={current.categoryLabel}
                onChange={(v) => updateCurrent((p) => ({ ...p, categoryLabel: v }))}
              />
              <LabeledInput
                label="Price (USD)"
                value={current.price}
                onChange={(v) => updateCurrent((p) => ({ ...p, price: v }))}
              />
              <LabeledInput
                label="Compare at price (optional)"
                value={current.compareAtPrice}
                onChange={(v) =>
                  updateCurrent((p) => ({ ...p, compareAtPrice: v }))
                }
              />
              <LabeledInput
                label="Main image URL"
                value={current.image}
                onChange={(v) => updateCurrent((p) => ({ ...p, image: v }))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.inStock}
                  onChange={(e) =>
                    updateCurrent((p) => ({ ...p, inStock: e.target.checked }))
                  }
                />
                In stock
              </label>
            </div>

            <LabeledTextarea
              label="Short description"
              value={current.shortDescription}
              onChange={(v) =>
                updateCurrent((p) => ({ ...p, shortDescription: v }))
              }
            />
            <LabeledTextarea
              label="Description"
              value={current.description}
              onChange={(v) => updateCurrent((p) => ({ ...p, description: v }))}
              rows={5}
            />

            <StringListEditor
              title="Highlights"
              values={current.highlights}
              onChange={(vals) => updateCurrent((p) => ({ ...p, highlights: vals }))}
            />

            <SpecListEditor
              values={current.specs}
              onChange={(vals) => updateCurrent((p) => ({ ...p, specs: vals }))}
            />

            <UrlListEditor
              title="Gallery images (WEBP)"
              values={current.gallery}
              onChange={(vals) => updateCurrent((p) => ({ ...p, gallery: vals }))}
              onUpload={(file) => uploadMedia("gallery", file)}
            />

            <UrlListEditor
              title="Detail images (WEBP)"
              values={current.detail}
              onChange={(vals) => updateCurrent((p) => ({ ...p, detail: vals }))}
              onUpload={(file) => uploadMedia("detail", file)}
            />

            <div className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Variants + inventory
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = current.variants.length + 1;
                    const id = `style-${String(nextNum).padStart(2, "0")}`;
                    updateCurrent((p) => ({
                      ...p,
                      variants: [
                        ...p.variants,
                        { id, label: `Style ${String(nextNum).padStart(2, "0")}`, image: "", inStock: true },
                      ],
                    }));
                    ensureInventoryRow(id);
                  }}
                  className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
                >
                  Add variant
                </button>
              </div>
              <div className="space-y-3">
                {current.variants.map((v, i) => {
                  const inv = current.inventory[v.id] || {
                    quantity: "100",
                    lowStockThreshold: "5",
                  };
                  return (
                    <div key={`${v.id}-${i}`} className="grid gap-2 rounded-lg border border-line/70 bg-white/50 p-3 pr-4 sm:grid-cols-6">
                      <LabeledInput
                        label="Variant ID"
                        value={v.id}
                        onChange={(val) =>
                          updateCurrent((p) => {
                            const oldId = p.variants[i].id;
                            const nextVariants = [...p.variants];
                            nextVariants[i] = { ...nextVariants[i], id: val };
                            const nextInv = { ...p.inventory };
                            nextInv[val] = nextInv[oldId] ?? { quantity: "100", lowStockThreshold: "5" };
                            delete nextInv[oldId];
                            return { ...p, variants: nextVariants, inventory: nextInv };
                          })
                        }
                      />
                      <LabeledInput
                        label="Label"
                        value={v.label}
                        onChange={(val) =>
                          updateCurrent((p) => {
                            const next = [...p.variants];
                            next[i] = { ...next[i], label: val };
                            return { ...p, variants: next };
                          })
                        }
                      />
                      <LabeledInput
                        label="Image URL"
                        value={v.image}
                        onChange={(val) =>
                          updateCurrent((p) => {
                            const next = [...p.variants];
                            next[i] = { ...next[i], image: val };
                            return { ...p, variants: next };
                          })
                        }
                      />
                      <LabeledInput
                        label="Quantity"
                        value={inv.quantity}
                        onChange={(val) =>
                          updateCurrent((p) => ({
                            ...p,
                            inventory: {
                              ...p.inventory,
                              [v.id]: { ...inv, quantity: val },
                            },
                          }))
                        }
                      />
                      <LabeledInput
                        label="Low stock alert"
                        value={inv.lowStockThreshold}
                        onChange={(val) =>
                          updateCurrent((p) => ({
                            ...p,
                            inventory: {
                              ...p.inventory,
                              [v.id]: { ...inv, lowStockThreshold: val },
                            },
                          }))
                        }
                      />
                      <div className="flex items-end justify-end gap-2 pr-1">
                        <label className="mb-1 flex items-center gap-2 whitespace-nowrap text-xs">
                          <input
                            type="checkbox"
                            checked={v.inStock !== false}
                            onChange={(e) =>
                              updateCurrent((p) => {
                                const next = [...p.variants];
                                next[i] = { ...next[i], inStock: e.target.checked };
                                return { ...p, variants: next };
                              })
                            }
                          />
                          In stock
                        </label>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <label className="cursor-pointer rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white">
                            Upload
                            <input
                              type="file"
                              accept="image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void uploadMedia("variants", file, v.id);
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
                            onClick={() =>
                              updateCurrent((p) => {
                                const next = p.variants.filter((_, idx) => idx !== i);
                                const invMap = { ...p.inventory };
                                delete invMap[v.id];
                                return { ...p, variants: next, inventory: invMap };
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Video (MP4, 720x1280)
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <LabeledInput
                  label="Video URL"
                  value={current.promoVideo?.src || ""}
                  onChange={(v) =>
                    updateCurrent((p) => ({
                      ...p,
                      promoVideo: { src: v, poster: p.promoVideo?.poster },
                    }))
                  }
                />
                <LabeledInput
                  label="Poster URL (optional)"
                  value={current.promoVideo?.poster || ""}
                  onChange={(v) =>
                    updateCurrent((p) => ({
                      ...p,
                      promoVideo: { src: p.promoVideo?.src || "", poster: v },
                    }))
                  }
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white">
                  Upload video
                  <input
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadMedia("video", file);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </label>
                {current.promoVideo?.src && (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
                    onClick={() => updateCurrent((p) => ({ ...p, promoVideo: null }))}
                  >
                    Clear video
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy || isPending}
                onClick={() => void saveCurrent()}
                className="rounded-xl bg-ink px-5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-paper disabled:opacity-50"
              >
                Save product
              </button>
              <button
                type="button"
                disabled={busy || isPending}
                onClick={() => void removeCurrent()}
                className="rounded-xl border border-red-200 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete product
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/20"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/20"
      />
    </label>
  );
}

function StringListEditor({
  title,
  values,
  onChange,
}: {
  title: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {title}
        </p>
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) =>
                onChange(values.map((x, idx) => (idx === i ? e.target.value : x)))
              }
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-lg border border-red-200 px-2 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecListEditor({
  values,
  onChange,
}: {
  values: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Specs
        </p>
        <button
          type="button"
          onClick={() => onChange([...values, { label: "", value: "" }])}
          className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={row.label}
              placeholder="Label"
              onChange={(e) =>
                onChange(
                  values.map((x, idx) =>
                    idx === i ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              value={row.value}
              placeholder="Value"
              onChange={(e) =>
                onChange(
                  values.map((x, idx) =>
                    idx === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-lg border border-red-200 px-2 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UrlListEditor({
  title,
  values,
  onChange,
  onUpload,
}: {
  title: string;
  values: string[];
  onChange: (v: string[]) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {title}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange([...values, ""])}
            className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
          >
            Add URL
          </button>
          <label className="cursor-pointer rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white">
            Upload
            <input
              type="file"
              accept="image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUpload(file);
                  e.currentTarget.value = "";
                }
              }}
            />
          </label>
        </div>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) =>
                onChange(values.map((x, idx) => (idx === i ? e.target.value : x)))
              }
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-lg border border-red-200 px-2 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
