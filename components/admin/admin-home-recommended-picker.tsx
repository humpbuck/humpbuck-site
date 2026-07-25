"use client";

import { MAX_HOME_RECOMMENDED } from "@/lib/catalog-home-recommended-limits";

type ProductOption = { id: string; slug: string; name: string };

export function AdminHomeRecommendedPicker({
  products,
  value,
  disabled = false,
  onChange,
}: {
  products: ProductOption[];
  value: string[];
  disabled?: boolean;
  onChange: (productIds: string[]) => void;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const selected = value
    .map((id) => byId.get(id))
    .filter((p): p is ProductOption => Boolean(p));
  const selectedIds = new Set(selected.map((p) => p.id));
  const available = [...products]
    .filter((p) => !selectedIds.has(p.id))
    .sort((a, b) => {
      const aName = a.name.trim() || a.slug.trim();
      const bName = b.name.trim() || b.slug.trim();
      return aName.localeCompare(bName, undefined, { sensitivity: "base" });
    });

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function toggle(productId: string) {
    if (selectedIds.has(productId)) {
      onChange(value.filter((id) => id !== productId));
      return;
    }
    if (value.length >= MAX_HOME_RECOMMENDED) return;
    onChange([...value, productId]);
  }

  return (
    <div className="mb-4 rounded-xl border border-line/80 bg-paper/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Homepage recommended ({selected.length}/{MAX_HOME_RECOMMENDED})
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
        Pick products for the homepage Recommended carousel. Order here is the
        display order.
      </p>

      {selected.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {selected.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5"
            >
              <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-muted">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink">
                {product.name.trim() || product.slug}
              </span>
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink/70 disabled:opacity-30"
              >
                Up
              </button>
              <button
                type="button"
                disabled={disabled || index === selected.length - 1}
                onClick={() => move(index, 1)}
                className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink/70 disabled:opacity-30"
              >
                Down
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(product.id)}
                className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700 disabled:opacity-30"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[11px] text-muted">
          None selected — homepage falls back to Automatic products.
        </p>
      )}

      {available.length > 0 ? (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-line/70 bg-white/70 p-2">
          {available.map((product) => {
            const atCap = value.length >= MAX_HOME_RECOMMENDED;
            return (
              <label
                key={product.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-ink/[0.04] ${
                  atCap ? "opacity-45" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={false}
                  disabled={disabled || atCap}
                  onChange={() => toggle(product.id)}
                  className="rounded border-line"
                />
                <span className="min-w-0 truncate">
                  {product.name.trim() || product.slug}
                </span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
