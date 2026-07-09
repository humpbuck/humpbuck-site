"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ProductManager = dynamic(
  () => import("@/components/admin/product-manager").then((mod) => mod.ProductManager),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-2xl border border-line bg-white/50 p-5 text-sm text-muted">
        Loading products editor…
      </p>
    ),
  },
);

export function ProductManagerLoader(
  props: ComponentProps<typeof ProductManager>,
) {
  return <ProductManager {...props} />;
}
