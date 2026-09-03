"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AdminCategoryOption } from "@/components/admin/storefront-placement-fields";

export type SidebarListedProduct = {
  selectionKey: string;
  slug: string;
  name: string;
  categoryId: string;
};

function compareProductsByName(a: SidebarListedProduct, b: SidebarListedProduct): number {
  const aName = a.name.trim() || a.slug.trim();
  const bName = b.name.trim() || b.slug.trim();
  return aName.localeCompare(bName, undefined, { sensitivity: "base" });
}

export function AdminProductSidebar({
  products,
  categories,
  selected,
  onSelect,
}: {
  products: SidebarListedProduct[];
  categories: AdminCategoryOption[];
  selected: string | null;
  onSelect: (selectionKey: string) => void;
}) {
  const grouped = useMemo(() => {
    const byCategory = new Map<string, SidebarListedProduct[]>();
    const unassigned: SidebarListedProduct[] = [];
    for (const category of categories) {
      byCategory.set(category.id, []);
    }
    for (const item of products) {
      const list = byCategory.get(item.categoryId);
      if (list) list.push(item);
      else unassigned.push(item);
    }
    for (const list of byCategory.values()) {
      list.sort(compareProductsByName);
    }
    unassigned.sort(compareProductsByName);
    return { byCategory, unassigned };
  }, [products, categories]);

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const selectedProduct = useMemo(
    () => products.find((item) => item.selectionKey === selected) ?? null,
    [products, selected],
  );

  useEffect(() => {
    if (!selectedProduct) return;
    const key = selectedProduct.categoryId || "__unassigned__";
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [selectedProduct?.categoryId, selectedProduct?.selectionKey]);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderProductButton(item: SidebarListedProduct) {
    const active = item.selectionKey === selected;
    return (
      <button
        type="button"
        key={item.selectionKey}
        onClick={() => onSelect(item.selectionKey)}
        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
          active
            ? "border-ink/30 bg-white"
            : "border-line/80 bg-white/60 hover:border-ink/15"
        }`}
      >
        <p className="truncate text-xs font-semibold text-ink">
          {item.name || "(New product)"}
        </p>
        <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.12em] text-muted">
          {item.slug || "draft-slug"}
        </p>
      </button>
    );
  }

  if (products.length === 0) {
    return <p className="text-xs text-muted">No products yet. Click Add.</p>;
  }

  return (
    <div className="space-y-2 pr-1">
      {categories.map((category) => {
        const items = grouped.byCategory.get(category.id) ?? [];
        const expanded = !collapsed.has(category.id);
        return (
          <div key={category.id} className="rounded-xl border border-line/80 bg-white/40">
            <button
              type="button"
              onClick={() => toggle(category.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              aria-expanded={expanded}
            >
              <ChevronDown
                size={14}
                className={`shrink-0 text-muted transition ${expanded ? "rotate-180" : ""}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-ink/80">
                {category.name}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-muted">
                {items.length}
              </span>
            </button>
            {expanded ? (
              <div className="space-y-1.5 border-t border-line/70 px-2 py-2">
                {items.length > 0 ? (
                  items.map((item) => renderProductButton(item))
                ) : (
                  <p className="px-1 py-1 text-[10px] text-muted">No products yet</p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      {grouped.unassigned.length > 0 ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40">
          <button
            type="button"
            onClick={() => toggle("__unassigned__")}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            aria-expanded={!collapsed.has("__unassigned__")}
          >
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition ${
                collapsed.has("__unassigned__") ? "" : "rotate-180"
              }`}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-amber-900/80">
              Unassigned
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-muted">
              {grouped.unassigned.length}
            </span>
          </button>
          {!collapsed.has("__unassigned__") ? (
            <div className="space-y-1.5 border-t border-amber-200/70 px-2 py-2">
              {grouped.unassigned.map((item) => renderProductButton(item))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
