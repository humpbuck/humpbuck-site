"use client";

export type AdminCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

/** Product form: pick one shop series (admin ProductCategory row). */
export function StorefrontPlacementFields({
  categoryId,
  categories,
  onCategoryIdChange,
}: {
  categoryId: string;
  categories: AdminCategoryOption[];
  onCategoryIdChange: (categoryId: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-line/80 bg-paper/40 p-4 sm:col-span-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Series
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Choose a series from Series. Order of series is set on the Series page.
        </p>
      </div>
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Series
        </span>
        <select
          value={categoryId}
          onChange={(event) => onCategoryIdChange(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
        >
          <option value="">Select series…</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
