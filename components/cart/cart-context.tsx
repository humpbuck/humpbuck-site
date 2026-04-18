"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "@/lib/cart-types";

const STORAGE_KEY = "humpbuck-cart";

/** Collapse duplicate lines from legacy carts (same slug + variant). */
function mergeDuplicateLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.slug}::${line.variantId ?? ""}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        ...line,
        qty: Math.min(99, Math.max(1, line.qty)),
      });
    } else {
      map.set(key, {
        ...prev,
        qty: Math.min(99, prev.qty + line.qty),
        variantLabel: prev.variantLabel ?? line.variantLabel,
      });
    }
  }
  return Array.from(map.values());
}

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  addItem: (line: CartLine) => void;
  setQty: (slug: string, qty: number, variantId?: string) => void;
  removeItem: (slug: string, variantId?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter(
      (x): x is CartLine =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as CartLine).slug === "string" &&
        typeof (x as CartLine).qty === "number",
    );
    return mergeDuplicateLines(filtered);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const itemCount = useMemo(
    () => items.reduce((s, i) => s + i.qty, 0),
    [items],
  );

  const addItem = useCallback((line: CartLine) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.slug === line.slug &&
          (p.variantId ?? "") === (line.variantId ?? ""),
      );
      if (idx === -1) {
        return [...prev, { ...line, qty: Math.min(99, Math.max(1, line.qty)) }];
      }
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        qty: Math.min(99, next[idx].qty + line.qty),
        variantLabel: line.variantLabel ?? next[idx].variantLabel,
      };
      return next;
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number, variantId?: string) => {
    setItems((prev) => {
      if (qty < 1) {
        return prev.filter(
          (p) =>
            !(p.slug === slug && (p.variantId ?? "") === (variantId ?? "")),
        );
      }
      return prev.map((p) =>
        p.slug === slug && (p.variantId ?? "") === (variantId ?? "")
          ? { ...p, qty: Math.min(99, qty) }
          : p,
      );
    });
  }, []);

  const removeItem = useCallback((slug: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter(
        (p) =>
          !(p.slug === slug && (p.variantId ?? "") === (variantId ?? "")),
      ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      addItem,
      setQty,
      removeItem,
      clear,
    }),
    [items, itemCount, addItem, setQty, removeItem, clear],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
