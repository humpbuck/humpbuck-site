"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice, getCartLineImage } from "@/lib/catalog";
import { isR2PublicObjectUrl } from "@/lib/r2-public-image";

const CART_QTY_MAX = 9999;

export function CartDrawer() {
  const { items, setQty, removeItem, cartDrawerOpen, closeCartDrawer } = useCart();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const displayItems = hydrated ? items : [];
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const subtotal = displayItems.reduce((sum, line) => {
    const unitPrice = typeof line.unitPrice === "number" ? line.unitPrice : 0;
    return sum + unitPrice * line.qty;
  }, 0);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(id);
    };
  }, [cartDrawerOpen]);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCartDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartDrawerOpen, closeCartDrawer]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-end transition-[visibility] duration-300 ${
        cartDrawerOpen ? "visible" : "invisible pointer-events-none"
      }`}
      aria-hidden={!cartDrawerOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          cartDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close bag"
        onClick={closeCartDrawer}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`relative flex h-full w-[min(100vw,420px)] max-w-full flex-col border-l border-[color:var(--color-line)] bg-paper transition-[transform,box-shadow] duration-300 ease-out ${
          cartDrawerOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-4 py-4">
          <h2 id="cart-drawer-title" className="font-serif text-xl tracking-tight text-ink">
            Bag
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeCartDrawer}
            className="rounded-lg p-2 text-ink/70 transition hover:bg-ink/[0.06]"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 text-xs text-muted">
            Guest checkout available — no account required. Fill shipping address and phone at checkout.
          </p>
          {displayItems.length === 0 ? (
            <p className="text-sm text-muted">Your bag is empty. Add items from a product page.</p>
          ) : (
            <ul className="space-y-4">
              {displayItems.map((line) => {
                const key = `${line.slug}-${line.variantId ?? ""}`;
                const lineImage = line.variantImage ?? getCartLineImage({
                  slug: line.slug,
                  name: line.productName || line.slug,
                  seriesSlug: "digitemp",
                  categoryLabel: "",
                  shortDescription: "",
                  description: "",
                  price: typeof line.unitPrice === "number" ? line.unitPrice : 0,
                  image: line.variantImage || "",
                  images: [],
                  highlights: [],
                  specs: [],
                  inStock: true,
                  variantOptions: [],
                }, line.variantId);
                const lineTotal = (typeof line.unitPrice === "number" ? line.unitPrice : 0) * line.qty;
                return (
                  <li
                    key={key}
                    className="flex gap-3 rounded-xl border border-[color:var(--color-line)] bg-white/70 p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
                      {lineImage ? (
                        <Image
                          src={lineImage}
                          alt={line.variantLabel || line.productName || line.slug}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized={isR2PublicObjectUrl(lineImage)}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${line.slug}`}
                        onClick={closeCartDrawer}
                        className="text-sm font-medium text-ink hover:underline"
                      >
                        {line.productName || line.variantLabel || line.slug}
                      </Link>
                      {line.variantLabel && (
                        <p className="mt-0.5 text-xs text-muted">{line.variantLabel}</p>
                      )}
                      <p className="mt-1 text-xs tabular-nums text-muted">
                        {formatPrice(typeof line.unitPrice === "number" ? line.unitPrice : 0)} each
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-[color:var(--color-line)] bg-paper">
                          <button
                            type="button"
                            aria-label={line.qty <= 1 ? "Remove from bag" : "Decrease quantity"}
                            onClick={() => {
                              if (line.qty <= 1) {
                                removeItem(line.slug, line.variantId);
                              } else {
                                setQty(line.slug, line.qty - 1, line.variantId);
                              }
                            }}
                            className="flex items-center justify-center px-2.5 py-1.5 text-ink hover:bg-ink/[0.06]"
                          >
                            <Minus className="size-3.5" strokeWidth={2} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={CART_QTY_MAX}
                            step={1}
                            inputMode="numeric"
                            value={line.qty}
                            aria-label="Quantity"
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isFinite(n)) return;
                              const next = Math.max(1, Math.min(CART_QTY_MAX, Math.floor(n)));
                              setQty(line.slug, next, line.variantId);
                            }}
                            className="w-14 border-x border-[color:var(--color-line)] bg-transparent px-1 text-center text-xs font-semibold tabular-nums outline-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={line.qty >= CART_QTY_MAX}
                            onClick={() =>
                              setQty(line.slug, Math.min(CART_QTY_MAX, line.qty + 1), line.variantId)
                            }
                            className="flex items-center justify-center px-2.5 py-1.5 text-ink hover:bg-ink/[0.06] disabled:opacity-40"
                          >
                            <Plus className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.slug, line.variantId)}
                          className="text-[11px] font-semibold uppercase tracking-widest text-muted hover:text-ink"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatPrice(lineTotal)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[color:var(--color-line)] bg-paper px-4 py-4">
          {displayItems.length > 0 && (
            <p className="mb-4 text-base font-semibold tabular-nums">Subtotal {formatPrice(subtotal)}</p>
          )}
          <div className="flex flex-col gap-2">
            {displayItems.length > 0 && (
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-6 py-3.5 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
              >
                Checkout
              </Link>
            )}
            <Link
              href="/cart"
              onClick={closeCartDrawer}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[color:var(--color-line)] bg-white px-6 py-3.5 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-ink/[0.03]"
            >
              View bag
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
