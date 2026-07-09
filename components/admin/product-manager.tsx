"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminProductSidebar,
  type SidebarListedProduct,
} from "@/components/admin/admin-product-sidebar";
import { AdminHomeSpotlightPicker } from "@/components/admin/admin-home-spotlight-picker";
import {
  StorefrontPlacementFields,
  applyStorefrontPlacementChange,
  applyStorefrontSeriesChange,
  applyStorefrontSubcategoryChange,
} from "@/components/admin/storefront-placement-fields";
import { inferSeriesSlugFromProductSlug } from "@/lib/catalog";
import {
  categoryHasSubcategories,
  coalesceStorefrontPlacementFields,
  normalizeStorefrontCategoryInput,
  normalizeStorefrontSubcategoryInput,
} from "@/lib/home-watch-sections";
import { DetailBlockListEditor } from "@/components/admin/detail-block-list-editor";
import {
  detailBlocksToImageUrls,
  emptyProductDetailBlock,
  parseDetailBlocksJson,
  type ProductDetailBlock,
} from "@/lib/product-detail-blocks";

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
  status: string;
  highlightsJson: string;
  specsJson: string;
  galleryJson: string;
  detailJson: string;
  variantsJson: string;
  promoVideoJson: string | null;
  storefrontCategory: string | null;
  storefrontSubcategory: string | null;
  storefrontSeries: string | null;
  homeSpotlight: boolean;
};

type SpecRow = { label: string; value: string };

/** Fixed PDP spec rows — admin only fills values. */
const DEFAULT_PRODUCT_SPEC_LABELS = [
  "CASE DIAMETER",
  "CASE THICKNESS",
  "BAND WIDTH",
  "CASE MATERIAL",
  "BAND MATERIAL",
  "MOVEMENT",
  "WEIGHT",
  "WATERPROOF",
] as const;

function defaultProductSpecRows(): SpecRow[] {
  return DEFAULT_PRODUCT_SPEC_LABELS.map((label) => ({ label, value: "" }));
}

function normalizeProductSpecsForEditor(saved: SpecRow[]): SpecRow[] {
  const valueByLabel = new Map<string, string>();
  for (const row of saved) {
    const key = row.label.trim().toUpperCase();
    if (key) valueByLabel.set(key, row.value);
  }
  return DEFAULT_PRODUCT_SPEC_LABELS.map((label) => ({
    label,
    value: valueByLabel.get(label) ?? "",
  }));
}

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
  status: string;
  highlights: string[];
  specs: SpecRow[];
  gallery: string[];
  detail: string[];
  detailBlocks: ProductDetailBlock[];
  variants: VariantRow[];
  promoVideo: PromoVideo;
  storefrontCategory: string;
  storefrontSubcategory: string;
  storefrontSeries: string;
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
  for (const variant of parseArray<VariantRow>(p.variantsJson, [])) {
    if (!map[variant.id]) {
      map[variant.id] = { quantity: "", lowStockThreshold: "5" };
    }
  }
  const detailBlocks = parseDetailBlocksJson(p.detailJson);
  const placement = coalesceStorefrontPlacementFields({
    storefrontCategory: p.storefrontCategory,
    storefrontSubcategory: p.storefrontSubcategory,
    storefrontSeries: p.storefrontSeries,
  });
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
    status: p.status === "archived" ? "archived" : "active",
    highlights: parseArray<string>(p.highlightsJson, []),
    specs: normalizeProductSpecsForEditor(parseArray<SpecRow>(p.specsJson, [])),
    gallery: parseArray<string>(p.galleryJson, []),
    detail: detailBlocksToImageUrls(detailBlocks),
    detailBlocks,
    variants: parseArray<VariantRow>(p.variantsJson, []),
    promoVideo: parseVideo(p.promoVideoJson),
    storefrontCategory: placement.storefrontCategory ?? "",
    storefrontSubcategory: placement.storefrontSubcategory ?? "",
    storefrontSeries: placement.storefrontSeries ?? "",
    inventory: map,
  };
}

function resolveProductMainImage(
  product: Pick<EditableProduct, "gallery" | "variants" | "image">,
): string {
  const fromGallery = product.gallery.map((url) => url.trim()).find(Boolean);
  if (fromGallery) return fromGallery;
  const fromVariant = product.variants.map((variant) => variant.image.trim()).find(Boolean);
  if (fromVariant) return fromVariant;
  return product.image.trim();
}

function resolveProductInStock(product: Pick<EditableProduct, "variants" | "inventory">): boolean {
  if (product.variants.length === 0) return false;
  return product.variants.some((variant) => {
    if (variant.inStock === false) return false;
    const quantity = Math.max(
      0,
      Math.floor(Number(product.inventory[variant.id]?.quantity) || 0),
    );
    return quantity > 0;
  });
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
    status: "active",
    highlights: [""],
    specs: defaultProductSpecRows(),
    gallery: [],
    detail: [],
    detailBlocks: [],
    variants: [{ id: "style-01", label: "Style 01", image: "", inStock: true }],
    promoVideo: null,
    storefrontCategory: "",
    storefrontSubcategory: "",
    storefrontSeries: "",
    inventory: {
      "style-01": { quantity: "", lowStockThreshold: "5" },
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

function nextDetailBlockSlot(blocks: ProductDetailBlock[]): number {
  return nextIndexedSlot(detailBlocksToImageUrls(blocks), "detail");
}

function productSelectionKey(product: EditableProduct, index: number): string {
  return product.id ?? `__new__:${index}`;
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
  const [selected, setSelected] = useState<string | null>(() => {
    const first = initialProducts[0];
    return first ? (first.id ?? "__new__:0") : null;
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [busy, setBusy] = useState(false);
  const [messageTimer, setMessageTimer] = useState<number | null>(null);
  const [homeSpotlightProductId, setHomeSpotlightProductId] = useState<string | null>(() => {
    const spotlight = initialProducts.find((p) => p.homeSpotlight && p.id);
    return spotlight?.id ?? null;
  });

  useEffect(() => {
    return () => {
      if (messageTimer != null) window.clearTimeout(messageTimer);
    };
  }, [messageTimer]);

  const selectedIndex = useMemo(() => {
    if (selected == null) return -1;
    return products.findIndex(
      (product, index) => productSelectionKey(product, index) === selected,
    );
  }, [products, selected]);

  const current = selectedIndex >= 0 ? products[selectedIndex] : null;

  const sidebarProducts = useMemo((): SidebarListedProduct[] => {
    return products.map((product, index) => ({
      selectionKey: productSelectionKey(product, index),
      slug: product.slug,
      name: product.name,
      storefrontCategory: product.storefrontCategory,
      storefrontSubcategory: product.storefrontSubcategory,
      storefrontSeries: product.storefrontSeries,
    }));
  }, [products]);

  const savedProductsForSpotlight = useMemo(
    () =>
      products
        .filter((product): product is EditableProduct & { id: string } => Boolean(product.id))
        .map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
        })),
    [products],
  );

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
    if (selectedIndex < 0) return;
    setProducts((prev) =>
      prev.map((product, index) =>
        index === selectedIndex ? mutator(product) : product,
      ),
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

  async function uploadMedia(
    section: "gallery" | "detail" | "variants" | "video",
    file: File,
    variantId?: string,
    detailBlockIndex?: number,
  ) {
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
          ? nextDetailBlockSlot(current.detailBlocks)
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
          const gallery = upsertByIndex(
            p.gallery,
            sortIndex ?? p.gallery.length + 1,
            payload.publicUrl!,
          );
          return {
            ...p,
            gallery,
            image: gallery.map((url) => url.trim()).find(Boolean) || p.image,
          };
        }
        if (section === "detail") {
          const blockIndex =
            detailBlockIndex ?? Math.max(0, p.detailBlocks.length - 1);
          const nextBlocks = [...p.detailBlocks];
          while (nextBlocks.length <= blockIndex) {
            nextBlocks.push(emptyProductDetailBlock());
          }
          nextBlocks[blockIndex] = {
            ...nextBlocks[blockIndex],
            image: payload.publicUrl!,
            stacked: false,
          };
          return {
            ...p,
            detailBlocks: nextBlocks,
            detail: detailBlocksToImageUrls(nextBlocks),
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
    const placementCategory = normalizeStorefrontCategoryInput(current.storefrontCategory);
    if (!current.storefrontCategory.trim()) {
      setFlashMessage("Category is required for the product to appear on the shop.", "error");
      return;
    }
    if (
      placementCategory &&
      categoryHasSubcategories(placementCategory) &&
      !normalizeStorefrontSubcategoryInput(current.storefrontSubcategory)
    ) {
      setFlashMessage("Subcategory is required (Men or Women).", "error");
      return;
    }
    setBusy(true);
    setFlashMessage("");
    const mainImage = resolveProductMainImage(current);
    const inStock = resolveProductInStock(current);
    const payload = {
      slug: current.slug.trim(),
      name: current.name.trim(),
      seriesSlug: inferSeriesSlugFromProductSlug(current.slug.trim()),
      storefrontCategory: current.storefrontCategory.trim(),
      storefrontSubcategory: current.storefrontSubcategory.trim(),
      storefrontSeries: current.storefrontSeries.trim(),
      categoryLabel: current.categoryLabel.trim(),
      shortDescription: current.shortDescription.trim(),
      description: current.description.trim(),
      price: Number(current.price) || 0,
      compareAtPrice:
        current.compareAtPrice.trim() === ""
          ? null
          : Number(current.compareAtPrice) || null,
      image: mainImage,
      inStock,
      highlights: current.highlights.filter((s) => s.trim()),
      specs: current.specs.filter((s) => s.value.trim()),
      gallery: current.gallery.filter((u) => u.trim()),
      detail: current.detailBlocks
        .map((block) => ({
          image: block.image.trim(),
          title: block.title.trim(),
          body: block.body.trim(),
          layout: block.layout,
        }))
        .filter(
          (block) => block.image.trim() || block.title.trim() || block.body.trim(),
        ),
      variants: current.variants.map((v) => ({
        id: v.id.trim(),
        label: v.label.trim(),
        image: v.image.trim(),
        inStock: v.inStock !== false,
      })),
      promoVideo: current.promoVideo?.src ? current.promoVideo : null,
      inventory: Object.entries(current.inventory).map(([variantId, row]) => ({
        variantId,
        quantity: row.quantity,
        lowStockThreshold: row.lowStockThreshold,
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
      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        slug?: string;
        error?: string;
      };
      if (!res.ok) {
        setFlashMessage(data.error || "Save failed.", "error");
        return;
      }
      const savedSlug = data.slug?.trim() || current.slug.trim();
      if (!current.id && data.id) {
        setProducts((prev) =>
          prev.map((p, index) => {
            if (index !== selectedIndex || p.id) return p;
            return { ...p, id: data.id!, slug: savedSlug, image: mainImage, inStock };
          }),
        );
        setSelected(data.id);
      } else if (current.id) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === current.id ? { ...p, slug: savedSlug, image: mainImage, inStock } : p,
          ),
        );
      }
      setFlashMessage("✅ Saved successfully.", "success");
      startTransition(() => router.refresh());
    } catch {
      setFlashMessage("Save failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function archiveCurrent() {
    if (!current) return;
    if (!current.id) {
      setFlashMessage("Save the product first before archiving.", "error");
      return;
    }
    if (!window.confirm(`Archive product ${current.slug}? It will stop selling.`)) return;
    setBusy(true);
    setFlashMessage("");
    try {
      const res = await fetch(`/api/admin/products/${current.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { archived?: boolean; error?: string };
      if (!res.ok || !data.archived) {
        setFlashMessage(data.error || "Archive failed.", "error");
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === current.id ? { ...p, inStock: false, status: "archived" } : p,
        ),
      );
      if (current.id === homeSpotlightProductId) {
        setHomeSpotlightProductId(null);
        void fetch("/api/admin/products/home-spotlight", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: null }),
        });
      }
      setFlashMessage("Archived.", "success");
      startTransition(() => router.refresh());
    } catch {
      setFlashMessage("Archive failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveHomeSpotlight(productId: string | null) {
    setBusy(true);
    setFlashMessage("");
    try {
      const res = await fetch("/api/admin/products/home-spotlight", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setFlashMessage(data.error || "Failed to update homepage spotlight.", "error");
        return;
      }
      setHomeSpotlightProductId(productId);
      setFlashMessage("Homepage spotlight updated.", "success");
      startTransition(() => router.refresh());
    } catch {
      setFlashMessage("Failed to update homepage spotlight.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function purgeCurrent() {
    if (!current?.id) return;
    if (current.status !== "archived") return;
    if (!window.confirm(`Permanently delete archived product ${current.slug}? This cannot be undone.`)) return;
    setBusy(true);
    setFlashMessage("");
    try {
      const res = await fetch(`/api/admin/products/${current.id}/purge`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { deleted?: boolean; error?: string };
      if (!res.ok || !data.deleted) {
        setFlashMessage(data.error || "Delete forever failed.", "error");
        return;
      }
      setProducts((prev) => prev.filter((_, index) => index !== selectedIndex));
      setSelected(sidebarProducts.find((p) => p.selectionKey !== selected)?.selectionKey ?? null);
      if (current.id === homeSpotlightProductId) {
        setHomeSpotlightProductId(null);
        void fetch("/api/admin/products/home-spotlight", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: null }),
        });
      }
      setFlashMessage("Deleted forever.", "success");
      startTransition(() => router.refresh());
    } catch {
      setFlashMessage("Delete forever failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-line bg-white/50 p-4">
        <AdminHomeSpotlightPicker
          products={savedProductsForSpotlight}
          value={homeSpotlightProductId}
          disabled={busy}
          onChange={saveHomeSpotlight}
        />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Products
          </p>
          <button
            type="button"
            onClick={() => {
              const draft = newProductDraft();
              setProducts((prev) => [draft, ...prev]);
              setSelected("__new__:0");
            }}
            className="rounded-lg border border-line px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white"
          >
            Add
          </button>
        </div>
        <AdminProductSidebar
          products={sidebarProducts}
          selected={selected}
          onSelect={setSelected}
        />
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
              <div>
                <LabeledInput
                  label="Slug"
                  value={current.slug}
                  onChange={(v) => updateCurrent((p) => ({ ...p, slug: v }))}
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  URL id for /product/your-slug. Lowercase letters, numbers, and hyphens only.
                  Saving a new slug updates inventory and reviews; old order links keep the previous slug.
                </p>
              </div>
              <LabeledInput
                label="Name"
                value={current.name}
                onChange={(v) => updateCurrent((p) => ({ ...p, name: v }))}
              />
              <StorefrontPlacementFields
                category={current.storefrontCategory}
                subcategory={current.storefrontSubcategory}
                series={current.storefrontSeries}
                categoryLabel={current.categoryLabel}
                onCategoryChange={(category) =>
                  updateCurrent((p) => ({
                    ...p,
                    ...applyStorefrontPlacementChange(p, category),
                  }))
                }
                onSubcategoryChange={(subcategory) =>
                  updateCurrent((p) => ({
                    ...p,
                    ...applyStorefrontSubcategoryChange(p, subcategory),
                  }))
                }
                onSeriesChange={(series) =>
                  updateCurrent((p) => ({
                    ...p,
                    ...applyStorefrontSeriesChange(p, series),
                  }))
                }
                onCategoryLabelChange={(categoryLabel) =>
                  updateCurrent((p) => ({ ...p, categoryLabel }))
                }
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

            <DetailBlockListEditor
              key={`${current.id ?? current.slug}-detail-blocks`}
              values={current.detailBlocks}
              onChange={(detailBlocks) =>
                updateCurrent((p) => ({
                  ...p,
                  detailBlocks,
                  detail: detailBlocksToImageUrls(detailBlocks),
                }))
              }
              onUpload={(file, blockIndex) => uploadMedia("detail", file, undefined, blockIndex)}
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
                onClick={() => void archiveCurrent()}
                className="rounded-xl border border-amber-200 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                Archive / 下架
              </button>
              <button
                type="button"
                disabled={busy || isPending || current.status !== "archived"}
                onClick={() => void purgeCurrent()}
                className="rounded-xl border border-red-200 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete forever
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
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Specs
      </p>
      <div className="space-y-2">
        {values.map((row, i) => (
          <div key={row.label} className="grid gap-2 sm:grid-cols-[minmax(9rem,1fr)_2fr]">
            <div className="flex items-center rounded-lg border border-line/70 bg-paper/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {row.label}
            </div>
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
