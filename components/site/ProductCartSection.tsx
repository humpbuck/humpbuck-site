"use client";

import { Check } from "lucide-react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import type { ProductVariantOption } from "@/lib/catalog";
import { ProductStyleVariants } from "@/components/site/ProductStyleVariants";
import { CART_ADDED_EVENT } from "@/lib/cart-events";
import { WhatsAppChatLink } from "@/components/site/WhatsAppChatLink";

export function ProductCartSection({
  slug,
  name,
  price,
  inStock,
  stockQuantity,
  variantOptions,
}: {
  slug: string;
  name: string;
  price: number;
  inStock: boolean;
  stockQuantity?: number;
  variantOptions?: ProductVariantOption[] | null;
}) {
  const { addItem, openCartDrawer } = useCart();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  /** Incrementing tick resets the "Added" timer on repeat clicks. */
  const [addedTick, setAddedTick] = useState(0);
  /** Flying "+1" toward header bag (viewport coords + delta). */
  const [flyParticle, setFlyParticle] = useState<{
    id: number;
    sx: number;
    sy: number;
    dx: number;
    dy: number;
  } | null>(null);
  const opts = variantOptions ?? [];
  const current = opts[variantIndex];
  const variantSellable = current ? (current.stockQuantity ?? 0) > 0 && current.inStock !== false : true;
  const productSellable = stockQuantity == null ? inStock : stockQuantity > 0;
  const canAdd = productSellable && variantSellable;
  const showAdded = addedTick > 0;

  useEffect(() => {
    setAddedTick(0);
  }, [variantIndex]);

  useEffect(() => {
    if (addedTick === 0) return;
    const id = window.setTimeout(() => setAddedTick(0), 2200);
    return () => window.clearTimeout(id);
  }, [addedTick]);

  function handleAdd() {
    if (!canAdd) return;
    addItem({
      slug,
      qty: 1,
      productName: name,
      unitPrice: price,
      variantId: current?.id,
      variantLabel: current?.label,
      variantImage: current?.image,
    });
    setAddedTick((n) => n + 1);
    window.dispatchEvent(new CustomEvent(CART_ADDED_EVENT));
    openCartDrawer();

    requestAnimationFrame(() => {
      const btn = addButtonRef.current;
      const bag = document.querySelector<HTMLElement>("[data-bag-fly-target]");
      if (!btn || !bag) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const a = btn.getBoundingClientRect();
      const b = bag.getBoundingClientRect();
      const sx = a.left + a.width / 2;
      const sy = a.top + a.height / 2;
      const ex = b.left + b.width / 2;
      const ey = b.top + b.height / 2;
      setFlyParticle({
        id: Date.now(),
        sx,
        sy,
        dx: ex - sx,
        dy: ey - sy,
      });
    });
  }

  return (
    <>
      {opts.length > 0 && (
        <ProductStyleVariants
          options={opts}
          productName={name}
          selectedIndex={variantIndex}
          onSelectedIndexChange={setVariantIndex}
        />
      )}

      {opts.length > 0 && !variantSellable && (
        <p className="mt-3 text-sm text-muted" role="status">
          This style is currently unavailable.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <button
            ref={addButtonRef}
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
            aria-live="polite"
            className={`inline-flex min-h-[48px] w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 ${
              showAdded
                ? "bg-emerald-800 text-paper ring-2 ring-emerald-600/40 ring-offset-2 ring-offset-paper"
                : "bg-ink text-paper hover:bg-ink/90"
            }`}
          >
            {showAdded ? (
              <>
                <Check className="size-4 shrink-0 stroke-[2.5]" aria-hidden />
                Added to bag
              </>
            ) : canAdd ? (
              "Add to bag"
            ) : (
              "Out of stock"
            )}
          </button>
          <WhatsAppChatLink
            productName={name}
            className="inline-flex min-h-[48px] w-full min-w-0 flex-1 items-center justify-center rounded-2xl border border-[color:var(--color-line)] bg-white/70 px-5 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/80 transition hover:border-ink/20 sm:px-6"
          />
        </div>
        {showAdded && (
          <p className="text-[13px] text-muted">
            Review your bag in the panel — or keep browsing here.
          </p>
        )}
      </div>

      {typeof document !== "undefined" &&
        flyParticle &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[300]"
            style={{
              left: flyParticle.sx,
              top: flyParticle.sy,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden
          >
            <span
              className="fly-to-bag-particle inline-flex size-8 items-center justify-center rounded-full bg-ink text-[13px] font-bold tabular-nums text-paper shadow-lg ring-2 ring-paper/30"
              style={
                {
                  "--fly-dx": `${flyParticle.dx}px`,
                  "--fly-dy": `${flyParticle.dy}px`,
                } as CSSProperties
              }
              onAnimationEnd={() => setFlyParticle(null)}
            >
              +1
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
