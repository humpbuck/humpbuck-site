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
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

const STORAGE_KEY = "humpbuck-cart";
const STORAGE_COOKIE = "humpbuck-cart";
const CART_QTY_MAX = 9999;

/** Collapse duplicate lines from legacy carts (same slug + variant). */
function mergeDuplicateLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.slug}::${line.variantId ?? ""}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        ...line,
        qty: Math.min(CART_QTY_MAX, Math.max(1, line.qty)),
      });
    } else {
      map.set(key, {
        ...prev,
        qty: Math.min(CART_QTY_MAX, prev.qty + line.qty),
        variantLabel: prev.variantLabel ?? line.variantLabel,
        variantImage: prev.variantImage ?? line.variantImage,
      });
    }
  }
  return Array.from(map.values());
}

function normalizeCartLine(line: CartLine): CartLine | null {
  const rawSlug = line.slug.trim();
  if (!rawSlug) return null;
  // Keep unknown slugs so custom/legacy products are still visible in bag.
  return { ...line, slug: rawSlug };
}

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  addItem: (line: CartLine) => void;
  setQty: (slug: string, qty: number, variantId?: string) => void;
  removeItem: (slug: string, variantId?: string) => void;
  clear: () => void;
  cartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? readCartCookie();
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
    const normalized = filtered
      .map((line) => normalizeCartLine(line))
      .filter((line): line is CartLine => line !== null);
    return mergeDuplicateLines(normalized);
  } catch {
    return [];
  }
}

function readCartCookie(): string | null {
  if (typeof document === "undefined") return null;
  const rows = document.cookie.split("; ");
  const row = rows.find((v) => v.startsWith(`${STORAGE_COOKIE}=`));
  if (!row) return null;
  const value = row.slice(STORAGE_COOKIE.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function writeCartCookie(lines: CartLine[]) {
  if (typeof document === "undefined") return;
  try {
    const raw = encodeURIComponent(JSON.stringify(lines));
    document.cookie = `${STORAGE_COOKIE}=${raw}; Path=/; Max-Age=2592000; SameSite=Lax`;
  } catch {
    // Ignore persistence errors and keep in-memory cart usable.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => loadCart());
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Some browsers/private modes may reject localStorage writes.
    }
    writeCartCookie(items);
  }, [items]);

  const itemCount = useMemo(
    () => items.reduce((s, i) => s + i.qty, 0),
    [items],
  );

  const addItem = useCallback((line: CartLine) => {
    const normalizedLine = normalizeCartLine(line);
    if (!normalizedLine) return;
    trackVisitorEvent({
      type: "add_to_cart",
      productSlug: normalizedLine.slug,
      meta: {
        qty: Math.max(1, Math.min(CART_QTY_MAX, normalizedLine.qty)),
        variantId: normalizedLine.variantId ?? null,
      },
    });
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.slug === normalizedLine.slug &&
          (p.variantId ?? "") === (normalizedLine.variantId ?? ""),
      );
      if (idx === -1) {
        return [
          ...prev,
          {
            ...normalizedLine,
            qty: Math.min(CART_QTY_MAX, Math.max(1, normalizedLine.qty)),
          },
        ];
      }
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        qty: Math.min(CART_QTY_MAX, next[idx].qty + normalizedLine.qty),
        variantLabel: normalizedLine.variantLabel ?? next[idx].variantLabel,
        variantImage: normalizedLine.variantImage ?? next[idx].variantImage,
      };
      return next;
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number, variantId?: string) => {
    trackVisitorEvent({
      type: qty < 1 ? "remove_from_cart" : "view_cart",
      productSlug: slug,
      meta: { qty: Math.max(0, Math.min(CART_QTY_MAX, qty)), variantId: variantId ?? null },
    });
    setItems((prev) => {
      if (qty < 1) {
        return prev.filter(
          (p) =>
            !(p.slug === slug && (p.variantId ?? "") === (variantId ?? "")),
        );
      }
      return prev.map((p) =>
        p.slug === slug && (p.variantId ?? "") === (variantId ?? "")
          ? { ...p, qty: Math.min(CART_QTY_MAX, qty) }
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
      cartDrawerOpen,
      openCartDrawer,
      closeCartDrawer,
    }),
    [
      items,
      itemCount,
      addItem,
      setQty,
      removeItem,
      clear,
      cartDrawerOpen,
      openCartDrawer,
      closeCartDrawer,
    ],
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
