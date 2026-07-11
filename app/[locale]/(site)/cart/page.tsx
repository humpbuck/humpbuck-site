"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/cart/cart-context";
import { DisplayPrice } from "@/components/site/DisplayPrice";
import { UsdChargeNotice } from "@/components/site/usd-charge-notice";
import { runWhenIdle } from "@/lib/defer-non-critical";
import { captureTrafficAttribution } from "@/lib/traffic-attribution";
import { CartCheckoutActions } from "@/components/cart/cart-checkout-actions";

const CART_QTY_MAX = 9999;

export default function CartPage() {
  const t = useTranslations("Cart");
  const { items, setQty, removeItem } = useCart();

  useEffect(() => {
    runWhenIdle(() => {
      captureTrafficAttribution();
    });
  }, []);

  const subtotal = items.reduce((sum, line) => {
    const unitPrice = typeof line.unitPrice === "number" ? line.unitPrice : 0;
    return sum + unitPrice * line.qty;
  }, 0);

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-3xl tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white/60 p-10 text-center text-muted">
          <p>{t("empty")}</p>
          <Link
            href="/product"
            className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
          >
            {t("continueShopping")}
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
                  className="flex gap-4 rounded-2xl border border-line bg-white/60 p-4"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-paper">
                    {imageSrc ? (
                      <StorefrontImage
                        src={imageSrc}
                        alt={line.variantLabel || line.productName || line.slug}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
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
                      <DisplayPrice
                        usd={typeof line.unitPrice === "number" ? line.unitPrice : 0}
                        stack={false}
                        primaryClassName=""
                        referenceClassName="text-[10px] text-muted"
                      />{" "}
                      {t("each")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.14em] text-muted">
                          {t("qty")}
                        </span>
                        <div className="inline-flex items-stretch overflow-hidden rounded-xl border border-line bg-paper">
                          <button
                            type="button"
                            aria-label={
                              line.qty <= 1 ? t("removeFromBagAria") : t("decreaseQtyAria")
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
                            aria-label={t("qtyInputAria")}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isFinite(n)) return;
                              const next = Math.max(1, Math.min(CART_QTY_MAX, Math.floor(n)));
                              setQty(line.slug, next, line.variantId);
                            }}
                            className="w-16 border-x border-line bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-ink outline-none"
                          />
                          <button
                            type="button"
                            aria-label={t("increaseQtyAria")}
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
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 rounded-2xl border border-line bg-white/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.14em] text-muted">{t("subtotal")}</span>
              <DisplayPrice
                usd={subtotal}
                className="text-xl font-semibold"
                referenceClassName="text-xs text-muted"
              />
            </div>
            <UsdChargeNotice className="mt-3" />
            <div className="mt-6">
              <CartCheckoutActions subtotalUsd={subtotal} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
