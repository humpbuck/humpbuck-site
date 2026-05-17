"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";

const CartDrawer = dynamic(
  () => import("@/components/cart/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false },
);

export function LazyCartDrawer() {
  const { cartDrawerOpen } = useCart();
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    queueMicrotask(() => setShouldMount(true));
  }, [cartDrawerOpen]);

  if (!shouldMount && !cartDrawerOpen) return null;
  return <CartDrawer />;
}
