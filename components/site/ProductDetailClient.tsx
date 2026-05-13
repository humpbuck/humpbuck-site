"use client";

import { useMemo, useState } from "react";
import type { ProductVariantOption } from "@/lib/catalog";
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

  const stockLabel = useMemo(() => {
    const qty = current?.stockQuantity;
    if (qty === 0) return "Out of stock";
    if (qty != null && qty <= 10) return `Low stock (${qty})`;
    if (qty != null) return `In stock (${qty})`;
    return inStock ? "In stock" : "Out of stock";
  }, [current, inStock]);

  return (
    <div>
      {options.length > 0 && (
        <ProductStyleVariants
          options={options}
          productName={name}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
        />
      )}

      <p className="mt-3 text-sm text-muted" role="status">
        {stockLabel}
      </p>

      <ProductCartSection slug={slug} name={name} price={price} variant={current} />
    </div>
  );
}
