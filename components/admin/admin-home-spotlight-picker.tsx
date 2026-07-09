"use client";

export function AdminHomeSpotlightPicker({
  products,
  value,
  disabled = false,
  onChange,
}: {
  products: { id: string; slug: string; name: string }[];
  value: string | null;
  disabled?: boolean;
  onChange: (productId: string | null) => void;
}) {
  const sorted = [...products].sort((a, b) => {
    const aName = a.name.trim() || a.slug.trim();
    const bName = b.name.trim() || b.slug.trim();
    return aName.localeCompare(bName, undefined, { sensitivity: "base" });
  });

  return (
    <label className="mb-4 block rounded-xl border border-line/80 bg-paper/40 p-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Homepage spotlight (below hero)
      </span>
      <select
        value={value ?? ""}
        disabled={disabled || sorted.length === 0}
        onChange={(event) => onChange(event.target.value || null)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25 disabled:cursor-not-allowed disabled:bg-ink/[0.03] disabled:text-ink/45"
      >
        <option value="">None</option>
        {sorted.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name.trim() || product.slug}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
        Pick one saved product for the homepage module under the hero.
      </p>
    </label>
  );
}
