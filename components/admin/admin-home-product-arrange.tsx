"use client";

import { useMemo, useState } from "react";
import {
  MAX_HOME_FEATURED,
  MAX_HOME_RECOMMENDED,
  MAX_HOME_RECOMMENDED_PER_CATEGORY,
} from "@/lib/catalog-home-recommended-limits";
import {
  flattenHomeRecommendedIdsByCategory,
  homeRecommendedCategoryDefs,
  homeRecommendedCategorySlugOf,
  splitHomeRecommendedIdsByCategory,
  type HomeRecommendedCategorySlug,
} from "@/lib/home-recommended-categories";

export type HomeArrangeProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  categoryId?: string | null;
};

type SectionKey = "recommended" | "featured";

const CATEGORY_DEFS = homeRecommendedCategoryDefs();

const CATEGORY_SECTION_TITLES: Record<HomeRecommendedCategorySlug, string> = {
  "ana-digi": "ANA-DIGI WATCHES",
  digital: "DIGITAL WATCHES",
  analog: "ANALOG WATCHES",
  automatic: "AUTOMATIC WATCHES",
};

function coverUrl(product: HomeArrangeProduct): string {
  return product.image.trim();
}

function ProductThumb({ product }: { product: HomeArrangeProduct }) {
  const src = coverUrl(product);
  if (!src) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-paper text-[10px] uppercase tracking-wider text-muted">
        No image
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin arrange thumbnail
    <img
      src={src}
      alt=""
      className="aspect-square w-full object-cover"
      draggable={false}
    />
  );
}

function ArrangeSection({
  title,
  hint,
  selected,
  available,
  max,
  selectedCountLabel,
  layout,
  disabled,
  onReorder,
  onRemove,
  onAdd,
}: {
  title: string;
  hint: string;
  selected: HomeArrangeProduct[];
  available: HomeArrangeProduct[];
  max: number;
  selectedCountLabel?: string;
  layout: "carousel" | "grid";
  disabled: boolean;
  onReorder: (nextIds: string[]) => void;
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filteredAvailable = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((p) => {
      const name = p.name.trim().toLowerCase();
      const slug = p.slug.trim().toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [available, query]);

  function handleDragStart(e: React.DragEvent, index: number) {
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

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setDraggingIndex(null);
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(fromIndex) || fromIndex === dropIndex) return;
    const next = [...selected];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(dropIndex, 0, moved);
    onReorder(next.map((p) => p.id));
  }

  const listClass =
    layout === "carousel"
      ? "mt-4 flex gap-3 overflow-x-auto pb-2"
      : "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4";

  const cardClass =
    layout === "carousel"
      ? "w-36 shrink-0 sm:w-40"
      : "min-w-0";

  return (
    <section className="rounded-2xl border border-line bg-white/50 p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
            {hint}
          </p>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {selectedCountLabel ?? `${selected.length}/${max}`}
        </p>
      </div>

      {selected.length > 0 ? (
        <ul className={listClass}>
          {selected.map((product, index) => (
            <li
              key={product.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`${cardClass} cursor-grab rounded-xl border border-line bg-white active:cursor-grabbing ${
                draggingIndex === index ? "opacity-50" : ""
              }`}
            >
              <div className="overflow-hidden rounded-t-xl bg-paper">
                <ProductThumb product={product} />
              </div>
              <div className="space-y-2 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                    {product.name.trim() || product.slug}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-muted">
                    #{index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(product.id)}
                  className="w-full rounded-lg border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-700 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-paper/60 px-4 py-6 text-center text-sm text-muted">
          None selected yet. Add products below.
        </p>
      )}

      <div className="mt-5 border-t border-line/70 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Add from catalog
          </p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or slug"
            className="w-full max-w-xs rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink outline-none transition focus:border-ink/25 sm:w-56"
          />
        </div>
        <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-line/70 bg-white/80 p-2">
          {filteredAvailable.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted">
              {available.length === 0
                ? selected.length >= max
                  ? "At capacity — remove one to add another."
                  : "No more products available."
                : "No matches."}
            </p>
          ) : (
            filteredAvailable.map((product) => {
              const atCap = selected.length >= max;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={disabled || atCap}
                  onClick={() => onAdd(product.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="size-9 shrink-0 overflow-hidden rounded-md border border-line bg-paper">
                    {coverUrl(product) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin list thumb
                      <img
                        src={coverUrl(product)}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {product.name.trim() || product.slug}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
                    Add
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export function AdminHomeProductArrange({
  products,
  initialRecommendedIds,
  initialFeaturedIds,
}: {
  products: HomeArrangeProduct[];
  initialRecommendedIds: string[];
  initialFeaturedIds: string[];
}) {
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const [recommendedByCategory, setRecommendedByCategory] = useState(() =>
    splitHomeRecommendedIdsByCategory(initialRecommendedIds, products),
  );
  const [featuredIds, setFeaturedIds] = useState(initialFeaturedIds);
  const [busySection, setBusySection] = useState<SectionKey | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const recommendedIds = useMemo(
    () => flattenHomeRecommendedIdsByCategory(recommendedByCategory),
    [recommendedByCategory],
  );

  const featured = featuredIds
    .map((id) => byId.get(id))
    .filter((p): p is HomeArrangeProduct => Boolean(p));

  const featuredSelected = new Set(featuredIds);
  const recommendedSelected = new Set(recommendedIds);

  const featuredAvailable = products
    .filter((p) => !featuredSelected.has(p.id))
    .sort((a, b) =>
      (a.name.trim() || a.slug).localeCompare(b.name.trim() || b.slug, undefined, {
        sensitivity: "base",
      }),
    );

  async function persistRecommended(
    nextByCategory: Record<HomeRecommendedCategorySlug, string[]>,
  ) {
    for (const slug of Object.keys(nextByCategory) as HomeRecommendedCategorySlug[]) {
      if ((nextByCategory[slug] ?? []).length > MAX_HOME_RECOMMENDED_PER_CATEGORY) {
        setMessageType("error");
        setMessage(
          `Select at most ${MAX_HOME_RECOMMENDED_PER_CATEGORY} watches per category.`,
        );
        return;
      }
    }

    const nextIds = flattenHomeRecommendedIdsByCategory(nextByCategory);
    const previous = recommendedByCategory;
    setRecommendedByCategory(nextByCategory);
    setBusySection("recommended");
    setMessage("");
    try {
      const res = await fetch("/api/admin/products/home-recommended", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: nextIds }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setRecommendedByCategory(previous);
        setMessageType("error");
        setMessage(data.error || "Save failed.");
        return;
      }
      setMessageType("success");
      setMessage(
        "Homepage category order saved. Empty categories are hidden on the storefront.",
      );
    } catch {
      setRecommendedByCategory(previous);
      setMessageType("error");
      setMessage("Save failed.");
    } finally {
      setBusySection(null);
    }
  }

  async function persistFeatured(nextIds: string[]) {
    const previous = featuredIds;
    setFeaturedIds(nextIds);
    setBusySection("featured");
    setMessage("");
    try {
      const res = await fetch("/api/admin/products/home-featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: nextIds }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setFeaturedIds(previous);
        setMessageType("error");
        setMessage(data.error || "Save failed.");
        return;
      }
      setMessageType("success");
      setMessage("Featured order saved. Homepage will match this order.");
    } catch {
      setFeaturedIds(previous);
      setMessageType("error");
      setMessage("Save failed.");
    } finally {
      setBusySection(null);
    }
  }

  function updateCategoryIds(
    category: HomeRecommendedCategorySlug,
    nextIds: string[],
  ) {
    const next = { ...recommendedByCategory, [category]: nextIds };
    void persistRecommended(next);
  }

  return (
    <div className="space-y-8">
      {message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="rounded-2xl border border-line bg-paper/40 px-4 py-3 text-sm text-muted">
        Each category has{" "}
        <span className="font-semibold text-ink">
          {MAX_HOME_RECOMMENDED_PER_CATEGORY}
        </span>{" "}
        slots (
        <span className="font-semibold text-ink">
          {recommendedIds.length}/{MAX_HOME_RECOMMENDED}
        </span>{" "}
        selected across ANA-DIGI / Digital / Analog / Automatic).
      </div>

      {CATEGORY_DEFS.map((def) => {
        const slug = def.slug as HomeRecommendedCategorySlug;
        const selectedIds = recommendedByCategory[slug] ?? [];
        const selected = selectedIds
          .map((id) => byId.get(id))
          .filter((p): p is HomeArrangeProduct => Boolean(p));
        const available = products
          .filter((p) => homeRecommendedCategorySlugOf(p.categoryId) === slug)
          .filter((p) => !recommendedSelected.has(p.id))
          .sort((a, b) =>
            (a.name.trim() || a.slug).localeCompare(
              b.name.trim() || b.slug,
              undefined,
              { sensitivity: "base" },
            ),
          );

        return (
          <ArrangeSection
            key={slug}
            title={CATEGORY_SECTION_TITLES[slug]}
            hint={`Homepage carousel for ${def.name}. Drag to reorder. Up to ${MAX_HOME_RECOMMENDED_PER_CATEGORY} watches in this category. Changes save immediately.`}
            selected={selected}
            available={available}
            max={MAX_HOME_RECOMMENDED_PER_CATEGORY}
            layout="carousel"
            disabled={busySection !== null}
            onReorder={(ids) => updateCategoryIds(slug, ids)}
            onRemove={(id) =>
              updateCategoryIds(
                slug,
                selectedIds.filter((x) => x !== id),
              )
            }
            onAdd={(id) => {
              if (selectedIds.length >= MAX_HOME_RECOMMENDED_PER_CATEGORY) return;
              if (selectedIds.includes(id)) return;
              updateCategoryIds(slug, [...selectedIds, id]);
            }}
          />
        );
      })}

      <ArrangeSection
        title="Featured"
        hint="Homepage Featured Ready Stock grid (up to 12). Drag cards to set order. Empty = site shows the first 12 catalog products."
        selected={featured}
        available={featuredAvailable}
        max={MAX_HOME_FEATURED}
        layout="grid"
        disabled={busySection !== null}
        onReorder={(ids) => void persistFeatured(ids)}
        onRemove={(id) =>
          void persistFeatured(featuredIds.filter((x) => x !== id))
        }
        onAdd={(id) => {
          if (featuredIds.length >= MAX_HOME_FEATURED) return;
          if (featuredIds.includes(id)) return;
          void persistFeatured([...featuredIds, id]);
        }}
      />
    </div>
  );
}
