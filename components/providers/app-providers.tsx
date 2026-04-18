"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart/cart-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
