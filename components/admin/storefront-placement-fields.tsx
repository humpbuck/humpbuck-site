"use client";

export type AdminCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

/** Product form: pick one fixed shop category. */
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
          Category
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Assign this product to ANA-DIGI, Digital, Analog, or Automatic.
          Collection pages are fixed on the storefront. PDP URL uses{" "}
          <span className="font-mono">/product/{"{category}"}/{"{model}"}</span>{" "}
          (ANA-DIGI → ana-digi).
        </p>
      </div>
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Category
        </span>
        <select
          value={categoryId}
          onChange={(event) => onCategoryIdChange(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
        >
          <option value="">Select category…</option>
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
