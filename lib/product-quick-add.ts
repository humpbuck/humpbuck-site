import {
  isVariantOptionSellable,
  type Product,
  type ProductVariantOption,
} from "@/lib/catalog";

export function firstSellableVariant(product: Product): ProductVariantOption | null {
  const options = product.variantOptions ?? [];
  if (options.length === 0) return null;
  return options.find(isVariantOptionSellable) ?? null;
}

export function canQuickAddProduct(product: Product, variantIndex: number): boolean {
  if (!product.inStock) return false;
  const options = product.variantOptions ?? [];
  if (options.length === 0) return true;
  const selected = options[variantIndex];
  if (selected && isVariantOptionSellable(selected)) return true;
  return firstSellableVariant(product) != null;
}

export function variantForQuickAdd(
  product: Product,
  variantIndex: number,
): ProductVariantOption | null {
  const options = product.variantOptions ?? [];
  if (options.length === 0) return null;
  const selected = options[variantIndex];
  if (selected && isVariantOptionSellable(selected)) return selected;
  return firstSellableVariant(product);
}
