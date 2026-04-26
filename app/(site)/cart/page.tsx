"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import {
  formatPrice,
  getCartLineImage,
  getProductBySlug,
} from "@/lib/catalog";
import { isR2PublicObjectUrl } from "@/lib/r2-public-image";

const CART_QTY_MAX = 9999;

export default function CartPage() {
  const { items, setQty, removeItem } = useCart();

  const lines = items.map((line) => {
    const p = getProductBySlug(line.slug);
    return { line, product: p };
  });

  const subtotal = lines.reduce((sum, { line, product }) => {
    if (!product) return sum;
    return sum + product.price * line.qty;
  }, 0);

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-3xl tracking-tight">Bag</h1>
      <p className="mt-2 text-sm text-muted">
        Review items before checkout. Prices use catalog rates at checkout.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-10 text-center text-muted">
          <p>Your bag is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {lines.map(({ line, product }) => {
            const key = `${line.slug}-${line.variantId ?? ""}`;
            if (!product) {
              return (
                <li
                  key={key}
                  className="flex gap-4 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-4"
                >
                  {line.variantImage ? (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-paper">
                      <Image
                        src={line.variantImage}
                        alt={line.variantLabel || line.slug}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized={isR2PublicObjectUrl(line.variantImage)}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {line.variantLabel || line.slug}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      This item is not in the current catalog, but remains in your
                      bag.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.14em] text-muted">
                          Qty
                        </span>
                        <div className="inline-flex items-stretch overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-paper">
                          <button
                            type="button"
                            aria-label={
                              line.qty <= 1
                                ? "Remove from bag"
                                : "Decrease quantity"
                            }
                            onClick={() => {
                              if (line.qty <= 1) {
                                removeItem(line.slug, line.variantId);
                              } else {
                                setQty(line.slug, line.qty - 1, line.variantId);
                              }
                            }}
                            className="flex items-center justify-center px-3 py-2 text-ink transition hover:bg-ink/[0.06]"
                          >
                            <Minus className="size-4" strokeWidth={2} aria-hidden />
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
                              const next = Math.max(
                                1,
                                Math.min(CART_QTY_MAX, Math.floor(n)),
                              );
                              setQty(line.slug, next, line.variantId);
                            }}
                            className="w-16 border-x border-[color:var(--color-line)] bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-ink outline-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={line.qty >= CART_QTY_MAX}
                            onClick={() =>
                              setQty(
                                line.slug,
                                Math.min(CART_QTY_MAX, line.qty + 1),
                                line.variantId,
                              )
                            }
                            className="flex items-center justify-center px-3 py-2 text-ink transition hover:bg-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="size-4" strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.slug, line.variantId)}
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            }
            const lineImage = getCartLineImage(product, line.variantId);
            return (
              <li
                key={key}
                className="flex gap-4 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-paper">
                  <Image
                    src={lineImage}
                    alt={
                      line.variantLabel
                        ? `${product.name} — ${line.variantLabel}`
                        : product.name
                    }
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={isR2PublicObjectUrl(lineImage)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {product.name}
                  </Link>
                  {line.variantLabel && (
                    <p className="mt-1 text-xs text-muted">{line.variantLabel}</p>
                  )}
                  <p className="mt-2 text-sm tabular-nums">
                    {formatPrice(product.price)} each
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.14em] text-muted">
                        Qty
                      </span>
                      <div className="inline-flex items-stretch overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-paper">
                        <button
                          type="button"
                          aria-label={
                            line.qty <= 1
                              ? "Remove from bag"
                              : "Decrease quantity"
                          }
                          onClick={() => {
                            if (line.qty <= 1) {
                              removeItem(line.slug, line.variantId);
                            } else {
                              setQty(
                                line.slug,
                                line.qty - 1,
                                line.variantId,
                              );
                            }
                          }}
                          className="flex items-center justify-center px-3 py-2 text-ink transition hover:bg-ink/[0.06]"
                        >
                          <Minus className="size-4" strokeWidth={2} aria-hidden />
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
                            const next = Math.max(
                              1,
                              Math.min(CART_QTY_MAX, Math.floor(n)),
                            );
                            setQty(line.slug, next, line.variantId);
                          }}
                          className="w-16 border-x border-[color:var(--color-line)] bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-ink outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={line.qty >= CART_QTY_MAX}
                          onClick={() =>
                            setQty(
                              line.slug,
                              Math.min(CART_QTY_MAX, line.qty + 1),
                              line.variantId,
                            )
                          }
                          className="flex items-center justify-center px-3 py-2 text-ink transition hover:bg-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="size-4" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.slug, line.variantId)}
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatPrice(product.price * line.qty)}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-10 flex flex-col gap-4 border-t border-[color:var(--color-line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold tabular-nums">
            Subtotal {formatPrice(subtotal)}
          </p>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-2xl bg-ink px-8 py-3.5 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
          >
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
