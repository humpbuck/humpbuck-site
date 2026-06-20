"use client";

import {
  STOREFRONT_CATEGORY_LABELS,
  STOREFRONT_CATEGORY_SLUGS,
  STOREFRONT_SERIES_KEYS,
  STOREFRONT_SERIES_LABELS,
  STOREFRONT_SUBCATEGORY_KEYS,
  STOREFRONT_SUBCATEGORY_LABELS,
  categoryHasSubcategories,
  formatStorefrontCategoryLabel,
  normalizeStorefrontCategoryInput,
  normalizeStorefrontSubcategoryInput,
} from "@/lib/home-watch-sections";

function LabeledSelect({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25 disabled:cursor-not-allowed disabled:bg-ink/[0.03] disabled:text-ink/45"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || "empty"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LabeledInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25"
      />
    </label>
  );
}

export function StorefrontPlacementFields({
  category,
  subcategory,
  series,
  categoryLabel,
  onCategoryChange,
  onSubcategoryChange,
  onSeriesChange,
  onCategoryLabelChange,
}: {
  category: string;
  subcategory: string;
  series: string;
  categoryLabel: string;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
  onSeriesChange: (series: string) => void;
  onCategoryLabelChange: (categoryLabel: string) => void;
}) {
  const activeCategory = normalizeStorefrontCategoryInput(category);
  const activeSubcategory = normalizeStorefrontSubcategoryInput(subcategory);
  const usesSubcategories =
    activeCategory != null && categoryHasSubcategories(activeCategory);

  return (
    <div className="space-y-4 rounded-xl border border-line/80 bg-paper/40 p-4 sm:col-span-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Storefront placement
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Category is Mechanical or Quartz. Subcategory is Men or Women. Optionally pick
          DIGI-TEMP or Ultra-thin under Men/Women for series grouping (Ultra-thin also
          powers the homepage Ultra-thin row).
        </p>
      </div>
      <div
        className={`grid gap-4 ${usesSubcategories ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}
      >
        <LabeledSelect
          label="Category"
          value={category}
          onChange={onCategoryChange}
          options={[
            { value: "", label: "Select category…" },
            ...STOREFRONT_CATEGORY_SLUGS.map((slug) => ({
              value: slug,
              label: STOREFRONT_CATEGORY_LABELS[slug],
            })),
          ]}
        />
        {usesSubcategories ? (
          <LabeledSelect
            label="Subcategory"
            value={subcategory}
            onChange={onSubcategoryChange}
            disabled={!activeCategory}
            options={[
              {
                value: "",
                label: activeCategory ? "Select subcategory…" : "Choose category first",
              },
              ...STOREFRONT_SUBCATEGORY_KEYS.map((key) => ({
                value: key,
                label: STOREFRONT_SUBCATEGORY_LABELS[key],
              })),
            ]}
          />
        ) : null}
        {usesSubcategories && activeSubcategory ? (
          <LabeledSelect
            label="Series (optional)"
            value={series}
            onChange={onSeriesChange}
            options={[
              { value: "", label: "None" },
              ...STOREFRONT_SERIES_KEYS.map((key) => ({
                value: key,
                label: STOREFRONT_SERIES_LABELS[key],
              })),
            ]}
          />
        ) : null}
      </div>
      <div>
        <LabeledInput
          label="Category label (on product cards)"
          value={categoryLabel}
          placeholder="Mechanical · Men · Ultra-thin"
          onChange={onCategoryLabelChange}
        />
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Short line above the product title. Auto-filled when you pick category, subcategory, and
          series; you can edit the wording.
        </p>
      </div>
    </div>
  );
}

export function applyStorefrontPlacementChange(
  product: {
    storefrontCategory: string;
    storefrontSubcategory: string;
    storefrontSeries: string;
    categoryLabel: string;
  },
  category: string,
): typeof product {
  const normalized = normalizeStorefrontCategoryInput(category);
  return {
    ...product,
    storefrontCategory: category,
    storefrontSubcategory: "",
    storefrontSeries: "",
    categoryLabel:
      normalized != null ? STOREFRONT_CATEGORY_LABELS[normalized] : product.categoryLabel,
  };
}

export function applyStorefrontSubcategoryChange(
  product: {
    storefrontCategory: string;
    storefrontSubcategory: string;
    storefrontSeries: string;
    categoryLabel: string;
  },
  subcategory: string,
): typeof product {
  const category = normalizeStorefrontCategoryInput(product.storefrontCategory);
  const subKey = normalizeStorefrontSubcategoryInput(subcategory);
  return {
    ...product,
    storefrontSubcategory: subcategory,
    storefrontSeries: "",
    categoryLabel:
      category && subKey
        ? formatStorefrontCategoryLabel(category, subKey)
        : product.categoryLabel,
  };
}

export function applyStorefrontSeriesChange(
  product: {
    storefrontCategory: string;
    storefrontSubcategory: string;
    storefrontSeries: string;
    categoryLabel: string;
  },
  series: string,
): typeof product {
  const category = normalizeStorefrontCategoryInput(product.storefrontCategory);
  const subKey = normalizeStorefrontSubcategoryInput(product.storefrontSubcategory);
  return {
    ...product,
    storefrontSeries: series,
    categoryLabel:
      category && subKey
        ? formatStorefrontCategoryLabel(category, subKey, series)
        : product.categoryLabel,
  };
}
