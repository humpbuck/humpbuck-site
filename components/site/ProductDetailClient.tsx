"use client";

import { useMemo, useState } from "react";
import { variantOptionStockLabel, type ProductVariantOption } from "@/lib/catalog";
import { ProductStyleVariants } from "@/components/site/ProductStyleVariants";
import { ProductCartSection } from "@/components/site/ProductCartSection";

export function ProductDetailClient({
  slug,
  name,
  price,
  inStock,
  variantOptions,
}: {
  slug: string;
  name: string;
  price: number;
  inStock: boolean;
  variantOptions?: ProductVariantOption[] | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const options = variantOptions ?? [];
  const current = options[selectedIndex];

  const stockLabel = useMemo(
    () => variantOptionStockLabel(current, inStock ? "In stock" : "Out of stock"),
    [current, inStock],
  );

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <p className="text-sm text-muted" role="status">
          {stockLabel}
        </p>
      </div>

      {options.length > 0 && (
        <ProductStyleVariants
          options={options}
          productName={name}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
        />
      )}

      <ProductCartSection slug={slug} name={name} price={price} variant={current} />
    </div>
  );
}
