"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/catalog";
import { emptyCheckoutAddress, validateCheckoutAddressForm } from "@/lib/checkout-address";
import { CheckoutAddressForm } from "@/components/checkout/checkout-address-form";
import { CheckoutShippingSection } from "@/components/checkout/checkout-shipping-section";
import { PaymentBrandButtons } from "@/components/checkout/payment-brand-buttons";
import { getTaxIdRequirement, quoteCheckoutShipping, type ShippingMethodId } from "@/lib/checkout-shipping-quote";
import { getAffiliatePidForCheckout, getTrafficSourceForCheckout } from "@/lib/traffic-attribution";

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { items, itemCount } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      setCustomerEmail(session.user.email);
    }
  }, [session?.user?.email]);
  const [billing, setBilling] = useState(emptyCheckoutAddress);
  const [customerEmail, setCustomerEmail] = useState("");
  const [shipping, setShipping] = useState(emptyCheckoutAddress);
  const [shipSameAsBilling, setShipSameAsBilling] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>("cainiao");
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const totalUnits = useMemo(() => items.reduce((sum, line) => sum + line.qty, 0), [items]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, line) => {
        const unitPrice = line.unitPrice ?? 0;
        return sum + unitPrice * line.qty;
      }, 0),
    [items],
  );

  const shipAddress = shipSameAsBilling ? billing : shipping;
  const shippingQuote = useMemo(
    () =>
      quoteCheckoutShipping({
        countryLabel: shipAddress.country,
        totalUnits,
        method: shippingMethod,
        state: shipAddress.state,
        postalCode: shipAddress.postalCode,
        weightKg: totalUnits * 0.2,
      }),
    [shipAddress.country, shipAddress.postalCode, shipAddress.state, shippingMethod, totalUnits],
  );

  const addressReady = validateCheckoutAddressForm(shipAddress).ok;
  const emailReady = customerEmail.trim().length > 0;
  const canPay = mounted && itemCount > 0 && emailReady && addressReady && shippingQuote.ok;
  const shippingPrice = mounted && shippingQuote.ok ? shippingQuote.shippingUsdCents / 100 : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal + shippingPrice - couponDiscount);

  async function ensureDraftOrder() {
    if (!customerEmail.trim()) throw new Error("Customer email is required");
    const res = await fetch("/api/checkout/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: customerEmail,
        totalUsd: total,
        items: items.map((line) => {
          const unitPrice = line.unitPrice ?? 0;
          const lineTotal = unitPrice * line.qty;
          return {
            slug: line.slug,
            name: line.productName ?? line.slug,
            productName: line.productName ?? line.slug,
            qty: line.qty,
            unitPrice,
            unitAmountCents: Math.round(unitPrice * 100),
            lineTotal,
            lineTotalCents: Math.round(lineTotal * 100),
            variantId: line.variantId,
            variantLabel: line.variantLabel,
            variantImage: line.variantImage,
          };
        }),
        billing,
        shipping: shipAddress,
        shippingMethod,
        shippingEstimateCny: shippingQuote.ok ? shippingQuote.shippingCny : 0,
        couponCode: appliedCoupon?.code ?? null,
        discountCents: Math.round(couponDiscount * 100),
        affiliatePid: getAffiliatePidForCheckout(),
        trafficSource: getTrafficSourceForCheckout(),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };
    if (!res.ok || !data.ok || !data.orderId) throw new Error(data.error || "Unable to create draft order");
    setOrderId(data.orderId);
    return data.orderId;
  }

  async function beginStripeCheckout() {
    if (!customerEmail.trim()) {
      setPaymentError("Customer email is required.");
      return;
    }
    setLoading("stripe");
    try {
      const draftOrderId = orderId ?? (await ensureDraftOrder());
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: draftOrderId,
          totalUsd: total,
          returnUrl: `${window.location.origin}/account/orders`,
          cancelUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || "Stripe not configured");
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function beginPayPalCheckout() {
    if (!customerEmail.trim()) {
      setPaymentError("Customer email is required.");
      return;
    }
    setLoading("paypal");
    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          totalUsd: total.toFixed(2),
          returnUrl: `${window.location.origin}/account/orders`,
          cancelUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; approvalUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.approvalUrl) throw new Error(data.error || "PayPal checkout failed");
      window.location.href = data.approvalUrl;
    } finally {
      setLoading(null);
    }
  }

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setCouponError(null);
    setPaymentError(null);
    setCouponLoading(true);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, affiliatePid: getAffiliatePidForCheckout() }),
      });
      const data = (await res.json()) as
        | { ok: true; coupon: { code: string; discountAmount: number; currency: string } }
        | { ok: false; error: string };
      if (!res.ok || !data.ok) {
        setAppliedCoupon(null);
        setCouponError(!data.ok ? data.error : "Coupon validation failed.");
        return;
      }
      setAppliedCoupon({ code: data.coupon.code, discountAmount: data.coupon.discountAmount / 100 });
    } catch {
      setCouponError("Unable to validate coupon.");
    } finally {
      setCouponLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-line bg-white/60 p-6 text-sm text-muted">Loading checkout…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Checkout</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Complete your order</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Fresh rebuild of checkout. The page is intentionally minimal so you can refine the UI step by step.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white/60 p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Customer email <span className="text-rose-500">*</span></h2>
            <div className="mt-4">
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter email for order receipt"
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white/60 p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Coupon code</h2>
            <div className="mt-4 flex gap-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void handleApplyCoupon()}
                disabled={couponLoading}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {couponLoading ? "Checking…" : "Apply"}
              </button>
            </div>
            {couponError ? <p className="mt-2 text-sm text-rose-600">{couponError}</p> : null}
            {paymentError ? <p className="mt-2 text-sm text-rose-600">{paymentError}</p> : null}
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span>Applied coupon: {appliedCoupon.code}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponError(null);
                  }}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <CheckoutAddressForm title="Billing address" value={billing} onChange={setBilling} idPrefix="bill" />

          <div className="flex items-start gap-3 rounded-xl border border-line bg-white/40 px-4 py-3">
            <input
              id="ship-same"
              type="checkbox"
              checked={shipSameAsBilling}
              onChange={(e) => setShipSameAsBilling(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-ink"
            />
            <label htmlFor="ship-same" className="text-sm leading-snug text-ink/90">
              <span className="font-medium">Ship to the same address</span>
              <span className="mt-0.5 block text-xs text-muted">
                Uncheck to enter a different delivery address.
              </span>
            </label>
          </div>

          {!shipSameAsBilling ? (
            <CheckoutAddressForm title="Shipping address" value={shipping} onChange={setShipping} idPrefix="ship" />
          ) : null}

          <CheckoutShippingSection
            countryLabel={shipAddress.country}
            shippingState={shipAddress.state}
            totalUnits={totalUnits}
            method={shippingMethod}
            onMethodChange={setShippingMethod}
            shippingPostalCode={shipAddress.postalCode}
          />
        </div>

        <aside className="sticky top-[88px] space-y-4 self-start rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-sm font-semibold text-ink">Order summary</h2>
          <div className="space-y-2 text-sm">
            {items.length === 0 ? (
              <p className="text-muted">Your cart is empty.</p>
            ) : (
              items.map((line) => {
                const name = line.productName ?? line.slug;
                const price = (line.unitPrice ?? 0) * line.qty;
                return (
                  <div key={line.slug} className="flex items-center justify-between gap-3 text-ink/90">
                    <span className="truncate">{name} × {line.qty}</span>
                    <span className="shrink-0">${price.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-line pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Shipping</span>
              <span className="font-medium">{mounted && shippingQuote.ok ? `$${shippingPrice.toFixed(2)}` : "—"}</span>
            </div>
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted">Coupon</span>
                <span className="font-medium text-emerald-700">-${couponDiscount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-base">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-semibold text-ink">${total.toFixed(2)}</span>
            </div>
          </div>

          {getTaxIdRequirement(shipAddress.country ? shipAddress.country.trim().toUpperCase() : null) ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Tax ID may be required for this destination.
            </p>
          ) : null}

          <div className="pt-1">
            <PaymentBrandButtons
              disabled={!canPay}
              loading={loading}
              onStripe={() => void beginStripeCheckout()}
              onPayPal={() => void beginPayPalCheckout()}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
