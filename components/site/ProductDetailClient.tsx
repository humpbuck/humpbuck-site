"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { isVariantOptionSellable, type ProductVariantOption } from "@/lib/catalog";
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
  const t = useTranslations("Product");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const options = variantOptions ?? [];
  const current = options[selectedIndex];

  const stockLabel = useMemo(() => {
    const opt = current;
    if (!opt) return inStock ? t("inStock") : t("outOfStock");
    if (!isVariantOptionSellable(opt)) return t("outOfStock");
    const qty = opt.stockQuantity;
    if (qty != null && qty <= 10) return t("lowStock", { count: qty });
    if (qty != null) return t("inStockCount", { count: qty });
    return t("inStock");
  }, [current, inStock, t]);

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
