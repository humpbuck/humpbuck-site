"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/catalog";
import { isR2PublicObjectUrl } from "@/lib/r2-public-image";

const CART_QTY_MAX = 9999;

export default function CartPage() {
  const { items, setQty, removeItem } = useCart();

  const subtotal = items.reduce((sum, line) => {
    const unitPrice = typeof line.unitPrice === "number" ? line.unitPrice : 0;
    return sum + unitPrice * line.qty;
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
        <>
          <ul className="mt-10 space-y-6">
            {items.map((line) => {
              const key = `${line.slug}-${line.variantId ?? ""}`;
              const imageSrc = line.variantImage || "";
              return (
                <li
                  key={key}
                  className="flex gap-4 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-4"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-paper">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={line.variantLabel || line.productName || line.slug}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized={isR2PublicObjectUrl(imageSrc)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.slug}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {line.productName || line.variantLabel || line.slug}
                    </Link>
                    {line.variantLabel && (
                      <p className="mt-1 text-xs text-muted">{line.variantLabel}</p>
                    )}
                    <p className="mt-2 text-sm tabular-nums">
                      {formatPrice(typeof line.unitPrice === "number" ? line.unitPrice : 0)} each
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.14em] text-muted">
                          Qty
                        </span>
                        <div className="inline-flex items-stretch overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-paper">
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
                              const next = Math.max(1, Math.min(CART_QTY_MAX, Math.floor(n)));
                              setQty(line.slug, next, line.variantId);
                            }}
                            className="w-16 border-x border-[color:var(--color-line)] bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-ink outline-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={line.qty >= CART_QTY_MAX}
                            onClick={() =>
                              setQty(line.slug, Math.min(CART_QTY_MAX, line.qty + 1), line.variantId)
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
            })}
          </ul>
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-[color:var(--color-line)] bg-white/70 p-4">
            <span className="text-sm uppercase tracking-[0.14em] text-muted">Subtotal</span>
            <span className="text-xl font-semibold tabular-nums">{formatPrice(subtotal)}</span>
          </div>
        </>
      )}
    </div>
  );
}
