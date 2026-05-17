"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider, useCart } from "@/components/cart/cart-context";

const CartDrawer = dynamic(
  () => import("@/components/cart/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false },
);

function LazyCartDrawer() {
  const { cartDrawerOpen } = useCart();
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    queueMicrotask(() => setShouldMount(true));
  }, [cartDrawerOpen]);

  if (!shouldMount && !cartDrawerOpen) return null;
  return <CartDrawer />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <LazyCartDrawer />
      </CartProvider>
    </SessionProvider>
  );
}
