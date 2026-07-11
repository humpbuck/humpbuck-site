"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart/cart-context";
import {
  checkoutFormFromSavedAddress,
  emptyCheckoutAddress,
  validateCheckoutAddressForm,
} from "@/lib/checkout-address";
import { readCheckoutPrefill, clearCheckoutPrefill } from "@/lib/checkout-prefill";
import { CheckoutAddressForm } from "@/components/checkout/checkout-address-form";
import { CheckoutExpressSection } from "@/components/checkout/checkout-express-section";
import { CheckoutShippingLoading } from "@/components/checkout/checkout-shipping-loading";
import { CheckoutPaymentSection } from "@/components/checkout/checkout-payment-section";
import type { PayPalPrefillPayload } from "@/components/cart/paypal-express-button";
import { getTaxIdRequirement, quoteCheckoutShipping, type ShippingMethodId } from "@/lib/checkout-shipping-quote";
import { DisplayPrice } from "@/components/site/DisplayPrice";
import { UsdChargeNotice } from "@/components/site/usd-charge-notice";
import { runWhenIdle } from "@/lib/defer-non-critical";
import { captureTrafficAttribution, getTrafficSourceForCheckout } from "@/lib/traffic-attribution";
import { preloadStripe } from "@/lib/stripe-browser";
import {
  fetchStripePreviewClientSecret,
  peekStripePreviewClientSecret,
  prefetchStripePreviewClientSecret,
} from "@/lib/stripe-preview-intent";

const CheckoutShippingSection = dynamic(
  () =>
    import("@/components/checkout/checkout-shipping-section").then(
      (m) => m.CheckoutShippingSection,
    ),
  { loading: () => <CheckoutShippingLoading /> },
);

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const searchParams = useSearchParams();
  const [cartReady, setCartReady] = useState(false);
  const { data: session } = useSession();
  const { items, itemCount } = useCart();
  const [paypalPrefillNotice, setPaypalPrefillNotice] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeFormLoading, setStripeFormLoading] = useState(false);
  const stripeClientSecretRef = useRef<string | null>(null);

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (pk) preloadStripe(pk);
  }, []);

  useEffect(() => {
    setCartReady(true);
  }, []);

  useEffect(() => {
    runWhenIdle(() => {
      captureTrafficAttribution();
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("from") !== "paypal-express") return;
    const prefill = readCheckoutPrefill();
    if (!prefill) return;

    if (prefill.email?.trim()) {
      setCustomerEmail(prefill.email.trim());
    }
    const shipForm =
      checkoutFormFromSavedAddress(prefill.shipping) ??
      checkoutFormFromSavedAddress(prefill.billing);
    const billForm =
      checkoutFormFromSavedAddress(prefill.billing) ?? shipForm;
    if (shipForm) {
      setShipping(shipForm);
      setBilling(billForm ?? shipForm);
      setBillSameAsShipping(
        JSON.stringify(billForm ?? shipForm) === JSON.stringify(shipForm),
      );
      setPaypalPrefillNotice(true);
    }
    clearCheckoutPrefill();
  }, [searchParams]);

  useEffect(() => {
    if (session?.user?.email) {
      setCustomerEmail((prev) => (prev.trim() ? prev : session.user!.email!));
    }
  }, [session?.user?.email]);

  const [billing, setBilling] = useState(emptyCheckoutAddress);
  const [customerEmail, setCustomerEmail] = useState("");
  const [shipping, setShipping] = useState(emptyCheckoutAddress);
  const [billSameAsShipping, setBillSameAsShipping] = useState(true);
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
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [checkoutOrigin, setCheckoutOrigin] = useState("");

  useEffect(() => {
    if (searchParams.get("from") === "paypal-express") return;
    if (!session?.user?.id) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/checkout/prefill");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          ok?: boolean;
          shipping?: ReturnType<typeof emptyCheckoutAddress> | null;
          billing?: ReturnType<typeof emptyCheckoutAddress> | null;
          billSameAsShipping?: boolean;
        };
        if (!data.ok || !data.shipping) return;

        let applied = false;
        setShipping((prev) => {
          if (prev.line1.trim()) return prev;
          applied = true;
          return data.shipping!;
        });
        if (!applied || cancelled) return;

        if (data.billSameAsShipping) {
          setBilling(data.shipping);
          setBillSameAsShipping(true);
        } else {
          setBilling(data.billing ?? data.shipping);
          setBillSameAsShipping(false);
        }
      } catch {
        // Prefill is best-effort; checkout still works with an empty form.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, session?.user?.id]);

  useEffect(() => {
    setCheckoutOrigin(window.location.origin);
  }, []);

  const totalUnits = useMemo(() => items.reduce((sum, line) => sum + line.qty, 0), [items]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, line) => {
        const unitPrice = line.unitPrice ?? 0;
        return sum + unitPrice * line.qty;
      }, 0),
    [items],
  );

  const shipAddress = shipping;
  const billingAddress = billSameAsShipping ? shipping : billing;
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

  const addressReady =
    validateCheckoutAddressForm(shipping).ok &&
    (billSameAsShipping || validateCheckoutAddressForm(billing).ok);
  const emailReady = customerEmail.trim().length > 0;
  const canPay = cartReady && itemCount > 0 && emailReady && addressReady && shippingQuote.ok;
  const shippingPrice = cartReady && shippingQuote.ok ? shippingQuote.shippingUsdCents / 100 : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal + shippingPrice - couponDiscount);
  const previewChargeUsd = Math.max(0.5, subtotal - couponDiscount);
  const stripeChargeUsd = canPay ? total : previewChargeUsd;

  async function checkoutFetch(input: string, init: RequestInit) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(t("paymentTimeout"));
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function redirectToPayment(url: string) {
    window.location.replace(url);
  }

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
        billing: billingAddress,
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

  async function beginPayPalCheckout() {
    if (!customerEmail.trim()) {
      setPaymentError(t("emailRequired"));
      return;
    }
    setPaymentError(null);
    setLoading("paypal");
    try {
      const draftOrderId = orderId ?? (await ensureDraftOrder());
      const res = await checkoutFetch("/api/checkout/paypal", {
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
      redirectToPayment(data.approvalUrl);
      return;
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : t("paypalError"));
      setLoading(null);
    }
  }

  useEffect(() => {
    if (!cartReady || itemCount === 0) return;
    const cached = peekStripePreviewClientSecret(previewChargeUsd);
    if (cached) {
      setStripeClientSecret((prev) => prev ?? cached);
      stripeClientSecretRef.current = stripeClientSecretRef.current ?? cached;
    }
    prefetchStripePreviewClientSecret(previewChargeUsd);
  }, [cartReady, itemCount, previewChargeUsd]);

  useEffect(() => {
    if (!cartReady || itemCount === 0) {
      setStripeClientSecret(null);
      stripeClientSecretRef.current = null;
      setPaymentOrderId(null);
      return;
    }

    let cancelled = false;
    const delay = stripeClientSecretRef.current ? 200 : 0;

    const timer = window.setTimeout(() => {
      void (async () => {
        setStripeFormLoading(true);
        try {
          let draftOrderId = orderId;
          if (canPay) {
            draftOrderId = orderId ?? (await ensureDraftOrder());
          }
          if (cancelled) return;

          let clientSecret: string | null = null;
          if (!canPay) {
            clientSecret = await fetchStripePreviewClientSecret(stripeChargeUsd);
          }
          if (!clientSecret) {
            const res = await checkoutFetch("/api/checkout/stripe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: canPay ? draftOrderId : undefined,
                totalUsd: stripeChargeUsd,
                customerEmail: customerEmail.trim() || undefined,
              }),
            });
            const data = (await res.json()) as {
              ok?: boolean;
              clientSecret?: string;
              error?: string;
            };
            if (!res.ok || !data.ok || !data.clientSecret) {
              throw new Error(data.error || t("stripeError"));
            }
            clientSecret = data.clientSecret;
          }
          if (!cancelled && clientSecret) {
            setStripeClientSecret(clientSecret);
            stripeClientSecretRef.current = clientSecret;
            if (draftOrderId) setPaymentOrderId(draftOrderId);
          }
        } catch (e) {
          if (!cancelled) {
            if (canPay) {
              setStripeClientSecret(null);
              stripeClientSecretRef.current = null;
              setPaymentError(e instanceof Error ? e.message : t("stripeError"));
            }
          }
        } finally {
          if (!cancelled) setStripeFormLoading(false);
        }
      })();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, itemCount, stripeChargeUsd, canPay, appliedCoupon?.code]);

  async function handleBeforeStripePay() {
    if (!canPay) throw new Error(t("completeDetailsToPay"));
    return orderId ?? (await ensureDraftOrder());
  }

  function handlePayPalPrefill(payload: PayPalPrefillPayload) {
    if (payload.email?.trim()) {
      setCustomerEmail(payload.email.trim());
    }
    const shipForm =
      checkoutFormFromSavedAddress(payload.shipping) ??
      checkoutFormFromSavedAddress(payload.billing);
    const billForm = checkoutFormFromSavedAddress(payload.billing);
    if (shipForm) {
      setShipping(shipForm);
      if (billForm && JSON.stringify(billForm) !== JSON.stringify(shipForm)) {
        setBilling(billForm);
        setBillSameAsShipping(false);
      } else {
        setBillSameAsShipping(true);
      }
      setPaypalPrefillNotice(true);
    }
  }

  async function handleCreatePayPalOrder() {
    if (!customerEmail.trim()) throw new Error(t("emailRequired"));
    const draftOrderId = orderId ?? (await ensureDraftOrder());
    return {
      orderId: draftOrderId,
      totalUsd: total,
      returnUrl: `${window.location.origin}/checkout/success?orderId=${encodeURIComponent(draftOrderId)}&provider=paypal`,
      cancelUrl: window.location.href,
    };
  }

  async function handleCapturePayPalOrder(orderIdForCapture: string, paypalOrderId: string) {
    const res = await checkoutFetch("/api/checkout/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "capture",
        orderId: orderIdForCapture,
        paypalOrderId,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) throw new Error(data.error || t("paypalError"));
  }

  function handleBillSameAsShippingChange(checked: boolean) {
    setBillSameAsShipping(checked);
    if (checked) {
      setBilling(shipping);
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
        {paypalPrefillNotice ? (
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            {t("paypalPrefillNotice")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          <CheckoutExpressSection
            cartReady={cartReady}
            itemCount={itemCount}
            chargeUsd={stripeChargeUsd}
            subtotalUsd={previewChargeUsd}
            stripeClientSecret={stripeClientSecret}
            canPay={canPay}
            returnUrlTemplate={`${checkoutOrigin}/checkout/success?orderId={ORDER_ID}&provider=stripe&payment_intent={PAYMENT_INTENT_ID}`}
            onError={setPaymentError}
            onBeforePay={handleBeforeStripePay}
            onPayPalPrefill={handlePayPalPrefill}
            onCreatePayPalOrder={handleCreatePayPalOrder}
            onCapturePayPalOrder={handleCapturePayPalOrder}
          />

          <div className="rounded-xl border border-line bg-white p-4">
            <label htmlFor="checkout-customer-email" className="text-sm font-semibold text-ink">
              {t("contactHeading")} <span className="text-rose-600">*</span>
            </label>
            <div className="mt-3">
              <input
                id="checkout-customer-email"
                type="email"
                required
                autoComplete="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <h2 className="text-sm font-semibold text-ink">{t("couponHeading")}</h2>
            <div className="mt-3 flex gap-2.5">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t("couponPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void handleApplyCoupon()}
                disabled={couponLoading}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {couponLoading ? t("checking") : t("apply")}
              </button>
            </div>
            {couponError ? <p className="mt-2 text-sm text-rose-600">{couponError}</p> : null}
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
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

          <CheckoutAddressForm title={t("deliveryTitle")} value={shipping} onChange={setShipping} idPrefix="ship" />

          <CheckoutShippingSection
            countryLabel={shipAddress.country}
            shippingState={shipAddress.state}
            totalUnits={totalUnits}
            method={shippingMethod}
            onMethodChange={setShippingMethod}
            shippingPostalCode={shipAddress.postalCode}
          />

          <CheckoutPaymentSection
            cartReady={cartReady}
            itemCount={itemCount}
            stripeClientSecret={stripeClientSecret}
            stripeFormLoading={stripeFormLoading}
            canPay={canPay}
            paypalLoading={loading === "paypal"}
            paymentError={paymentError}
            returnUrlTemplate={`${checkoutOrigin}/checkout/success?orderId={ORDER_ID}&provider=stripe&payment_intent={PAYMENT_INTENT_ID}`}
            billSameAsShipping={billSameAsShipping}
            onBillSameAsShippingChange={handleBillSameAsShippingChange}
            billing={billing}
            onBillingChange={setBilling}
            onPayPal={() => void beginPayPalCheckout()}
            onPaymentError={setPaymentError}
            onBeforeStripePay={handleBeforeStripePay}
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
        </aside>
      </div>
    </div>
  );
}
