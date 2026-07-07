"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart/cart-context";
import { emptyCheckoutAddress, validateCheckoutAddressForm } from "@/lib/checkout-address";
import { CheckoutAddressForm } from "@/components/checkout/checkout-address-form";
import { CheckoutShippingLoading } from "@/components/checkout/checkout-shipping-loading";
import { PaymentBrandButtons } from "@/components/checkout/payment-brand-buttons";
import { getTaxIdRequirement, quoteCheckoutShipping, type ShippingMethodId } from "@/lib/checkout-shipping-quote";
import { DisplayPrice } from "@/components/site/DisplayPrice";
import { UsdChargeNotice } from "@/components/site/usd-charge-notice";
import { runWhenIdle } from "@/lib/defer-non-critical";
import { captureTrafficAttribution, getTrafficSourceForCheckout } from "@/lib/traffic-attribution";

const CheckoutShippingSection = dynamic(
  () =>
    import("@/components/checkout/checkout-shipping-section").then(
      (m) => m.CheckoutShippingSection,
    ),
  { loading: () => <CheckoutShippingLoading /> },
);

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const [cartReady, setCartReady] = useState(false);
  const { data: session } = useSession();
  const { items, itemCount } = useCart();

  useEffect(() => {
    setCartReady(true);
  }, []);

  useEffect(() => {
    runWhenIdle(() => {
      captureTrafficAttribution();
    });
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      setCustomerEmail((prev) => (prev.trim() ? prev : session.user!.email!));
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
  const deferredShipCountry = useDeferredValue(shipAddress.country);
  const deferredShipState = useDeferredValue(shipAddress.state);
  const deferredShipPostal = useDeferredValue(shipAddress.postalCode);
  const deferredTotalUnits = useDeferredValue(totalUnits);
  const shippingQuote = useMemo(
    () =>
      quoteCheckoutShipping({
        countryLabel: deferredShipCountry,
        totalUnits: deferredTotalUnits,
        method: shippingMethod,
        state: deferredShipState,
        postalCode: deferredShipPostal,
        weightKg: deferredTotalUnits * 0.2,
      }),
    [
      deferredShipCountry,
      deferredShipPostal,
      deferredShipState,
      deferredTotalUnits,
      shippingMethod,
    ],
  );

  const addressReady = validateCheckoutAddressForm(shipAddress).ok;
  const emailReady = customerEmail.trim().length > 0;
  const canPay = cartReady && itemCount > 0 && emailReady && addressReady && shippingQuote.ok;
  const shippingPrice = cartReady && shippingQuote.ok ? shippingQuote.shippingUsdCents / 100 : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal + shippingPrice - couponDiscount);

  async function ensureDraftOrder() {
    if (!customerEmail.trim()) throw new Error(t("emailRequired"));
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
        trafficSource: getTrafficSourceForCheckout(),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };
    if (!res.ok || !data.ok || !data.orderId) throw new Error(data.error || t("draftOrderFailed"));
    setOrderId(data.orderId);
    return data.orderId;
  }

  async function beginStripeCheckout() {
    if (!customerEmail.trim()) {
      setPaymentError(t("emailRequired"));
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
          returnUrl: `${window.location.origin}/checkout/success?orderId=${encodeURIComponent(draftOrderId)}&provider=stripe`,
          cancelUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || t("stripeError"));
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function beginPayPalCheckout() {
    if (!customerEmail.trim()) {
      setPaymentError(t("emailRequired"));
      return;
    }
    setLoading("paypal");
    try {
      const draftOrderId = orderId ?? (await ensureDraftOrder());
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          orderId: draftOrderId,
          totalUsd: total.toFixed(2),
          returnUrl: `${window.location.origin}/checkout/success?orderId=${encodeURIComponent(draftOrderId)}&provider=paypal`,
          cancelUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; approvalUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.approvalUrl) throw new Error(data.error || t("paypalError"));
      window.location.href = data.approvalUrl;
    } finally {
      setLoading(null);
    }
  }

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError(t("enterCoupon"));
      return;
    }
    setCouponError(null);
    setPaymentError(null);
    setCouponLoading(true);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as
        | { ok: true; coupon: { code: string; discountAmount: number; currency: string } }
        | { ok: false; error: string };
      if (!res.ok || !data.ok) {
        setAppliedCoupon(null);
        setCouponError(!data.ok ? data.error : t("couponInvalid"));
        return;
      }
      setAppliedCoupon({ code: data.coupon.code, discountAmount: data.coupon.discountAmount / 100 });
    } catch {
      setCouponError(t("couponNetwork"));
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t("kicker")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white/60 p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("emailHeading")} <span className="text-rose-500">*</span>
            </h2>
            <div className="mt-4">
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white/60 p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("couponHeading")}</h2>
            <div className="mt-4 flex gap-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t("couponPlaceholder")}
                className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void handleApplyCoupon()}
                disabled={couponLoading}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {couponLoading ? t("checking") : t("apply")}
              </button>
            </div>
            {couponError ? <p className="mt-2 text-sm text-rose-600">{couponError}</p> : null}
            {paymentError ? <p className="mt-2 text-sm text-rose-600">{paymentError}</p> : null}
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span>{t("appliedCoupon", { code: appliedCoupon.code })}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponError(null);
                  }}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {t("remove")}
                </button>
              </div>
            ) : null}
          </div>

          <CheckoutAddressForm title={t("billingTitle")} value={billing} onChange={setBilling} idPrefix="bill" />

          <div className="flex items-start gap-3 rounded-xl border border-line bg-white/40 px-4 py-3">
            <input
              id="ship-same"
              type="checkbox"
              checked={shipSameAsBilling}
              onChange={(e) => setShipSameAsBilling(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-ink"
            />
            <label htmlFor="ship-same" className="text-sm leading-snug text-ink/90">
              <span className="font-medium">{t("shipSameTitle")}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {t("shipSameHint")}
              </span>
            </label>
          </div>

          {!shipSameAsBilling ? (
            <CheckoutAddressForm title={t("shippingTitle")} value={shipping} onChange={setShipping} idPrefix="ship" />
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
          <h2 className="text-sm font-semibold text-ink">{t("orderSummary")}</h2>
          <div className="space-y-2 text-sm" suppressHydrationWarning>
            {!cartReady ? (
              <p className="text-muted">{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className="text-muted">{t("cartEmpty")}</p>
            ) : (
              items.map((line) => {
                const name = line.productName ?? line.slug;
                const price = (line.unitPrice ?? 0) * line.qty;
                return (
                  <div key={`${line.slug}-${line.variantId ?? ""}`} className="flex items-center justify-between gap-3 text-ink/90">
                    <span className="truncate">{t("orderLine", { name, qty: line.qty })}</span>
                    <DisplayPrice
                      usd={price}
                      stack={false}
                      className="shrink-0 font-medium"
                      referenceClassName="text-[10px] text-muted"
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-line pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">{t("subtotal")}</span>
              <DisplayPrice
                usd={subtotal}
                stack={false}
                className="font-medium"
                referenceClassName="text-[10px] text-muted"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">{t("shipping")}</span>
              <span className="font-medium">
                {cartReady && shippingQuote.ok ? (
                  <DisplayPrice
                    usd={shippingPrice}
                    stack={false}
                    referenceClassName="text-[10px] text-muted"
                  />
                ) : (
                  t("shippingDash")
                )}
              </span>
            </div>
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted">{t("coupon")}</span>
                <span className="font-medium text-emerald-700">
                  -<DisplayPrice
                    usd={couponDiscount}
                    stack={false}
                    hideReference
                    primaryClassName="text-emerald-700"
                  />
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-base">
              <span className="font-semibold text-ink">{t("total")}</span>
              <DisplayPrice
                usd={total}
                stack={false}
                className="font-semibold text-ink"
                referenceClassName="text-xs text-muted"
              />
            </div>
            <UsdChargeNotice className="mt-3" />
          </div>

          {getTaxIdRequirement(shipAddress.country ? shipAddress.country.trim().toUpperCase() : null) ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {t("taxIdHint")}
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
