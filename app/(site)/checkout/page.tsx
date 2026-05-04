"use client";

import type { UserAddress } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckoutAddressFields } from "@/components/checkout/checkout-address-fields";
import { CheckoutShippingSection } from "@/components/checkout/checkout-shipping-section";
import { PaymentBrandButtons } from "@/components/checkout/payment-brand-buttons";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice, getProductBySlug } from "@/lib/catalog";
import {
  addressFormToRecord,
  checkoutAddressPhysicalEqual,
  checkoutFormFromSavedAddress,
  emptyCheckoutAddress,
  isCheckoutAddressComplete,
} from "@/lib/checkout-address";
import { validateCheckoutAddressForm } from "@/lib/checkout-address-consistency";
import {
  isCheckoutCountryChina,
  quoteCheckoutShipping,
  type ShippingMethodId,
} from "@/lib/checkout-shipping-quote";
import { getDestinationCoverage } from "@/lib/logistics-estimate";
import {
  captureAffiliatePidAttribution,
  getAffiliatePidForCheckout,
  captureTrafficAttribution,
  getTrafficSourceForCheckout,
} from "@/lib/traffic-attribution";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

export default function CheckoutPage() {
  const { items, itemCount } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [billing, setBilling] = useState(emptyCheckoutAddress);
  const [shipping, setShipping] = useState(emptyCheckoutAddress);
  const [shipSameAsBilling, setShipSameAsBilling] = useState(true);
  const [orderNotes, setOrderNotes] = useState("");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodId>("cainiao");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAddressesAvailable, setSavedAddressesAvailable] = useState(false);
  const [prefillFromAccountNotice, setPrefillFromAccountNotice] = useState(false);
  const billingRef = useRef(billing);
  billingRef.current = billing;

  useEffect(() => {
    if (session?.user?.email) {
      setEmail((e) => e || session.user?.email || "");
    }
  }, [session?.user?.email]);

  const applyAccountAddresses = useCallback(
    async (force: boolean) => {
      if (status !== "authenticated" || !session?.user?.id) return false;
      const res = await fetch("/api/account/addresses", { cache: "no-store" });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        billing: UserAddress | null;
        shipping: UserAddress | null;
        profile: { firstName: string | null; lastName: string | null };
      };
      const billForm = checkoutFormFromSavedAddress(data.billing, data.profile);
      const shipForm = checkoutFormFromSavedAddress(data.shipping, data.profile);
      const hasSaved = Boolean(billForm ?? shipForm);
      setSavedAddressesAvailable(hasSaved);
      if (!billForm && !shipForm) return false;
      if (!force && billingRef.current.line1.trim()) return false;

      if (
        billForm &&
        shipForm &&
        !checkoutAddressPhysicalEqual(billForm, shipForm)
      ) {
        setShipSameAsBilling(false);
        setBilling(billForm);
        setShipping(shipForm);
      } else {
        setShipSameAsBilling(true);
        setBilling(billForm ?? shipForm!);
      }
      setPrefillFromAccountNotice(true);
      return true;
    },
    [status, session?.user?.id],
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setSavedAddressesAvailable(false);
      setPrefillFromAccountNotice(false);
      return;
    }
    void applyAccountAddresses(false);
  }, [status, session?.user?.id, applyAccountAddresses]);

  useEffect(() => {
    captureTrafficAttribution();
    captureAffiliatePidAttribution();
  }, []);

  useEffect(() => {
    if (shipSameAsBilling) {
      setShipping(billing);
    }
  }, [billing, shipSameAsBilling]);

  const subtotal = items.reduce((sum, line) => {
    const p = getProductBySlug(line.slug);
    const unitPrice = p?.price ?? (typeof line.unitPrice === "number" ? line.unitPrice : 0);
    return sum + unitPrice * line.qty;
  }, 0);
  const shipCountryLabel = useMemo(() => {
    const src = shipSameAsBilling ? billing.country : shipping.country;
    return (src || "").trim();
  }, [shipSameAsBilling, billing.country, shipping.country]);

  const shipPostalCode = useMemo(() => {
    const src = shipSameAsBilling ? billing : shipping;
    return (src.postalCode || "").trim();
  }, [shipSameAsBilling, billing, shipping]);

  const shipState = useMemo(() => {
    const src = shipSameAsBilling ? billing : shipping;
    return (src.state || "").trim();
  }, [shipSameAsBilling, billing, shipping]);

  const totalUnits = useMemo(
    () => items.reduce((s, line) => s + line.qty, 0),
    [items],
  );

  useEffect(() => {
    if (isCheckoutCountryChina(shipCountryLabel)) {
      setShippingMethod((prev) =>
        prev === "china_zto" || prev === "china_sf" ? prev : "china_zto",
      );
      return;
    }
    const cov = getDestinationCoverage(shipCountryLabel, {
      state: shipState,
    });
    setShippingMethod((prev) => {
      if (prev === "china_zto" || prev === "china_sf") {
        if (cov.cainiao) return "cainiao";
        if (cov.yanwen) return "yanwen";
        return "cainiao";
      }
      if (!cov.cainiao && !cov.yanwen) return "cainiao";
      if (prev === "cainiao" && !cov.cainiao) {
        if (cov.yanwen) return "yanwen";
        return "cainiao";
      }
      if (prev === "yanwen" && !cov.yanwen) {
        if (cov.cainiao) return "cainiao";
        return "cainiao";
      }
      return prev;
    });
  }, [shipCountryLabel, shipState]);

  const shippingQuote = useMemo(
    () =>
      quoteCheckoutShipping({
        countryLabel: shipCountryLabel,
        totalUnits,
        method: shippingMethod,
        state: shipState,
        postalCode: shipPostalCode,
      }),
    [shipCountryLabel, totalUnits, shippingMethod, shipPostalCode, shipState],
  );

  const shippingUsd =
    shippingQuote.ok && shippingQuote.shippingUsdCents > 0
      ? shippingQuote.shippingUsdCents / 100
      : 0;
  const totalDue = subtotal + shippingUsd;
  const totalDueCents = Math.max(0, Math.round(totalDue * 100));
  const appliedDiscountUsd = (appliedCoupon?.discountCents ?? 0) / 100;
  const discountedTotalDue = Math.max(0, totalDue - appliedDiscountUsd);

  const resolvedEmail = useMemo(() => {
    return (email.trim() || session?.user?.email || "").trim();
  }, [email, session?.user?.email]);

  const billingOk = isCheckoutAddressComplete(billing);
  const shippingOk =
    shipSameAsBilling || isCheckoutAddressComplete(shipping);

  const billingConsistency = useMemo(
    () => validateCheckoutAddressForm(billing),
    [billing],
  );
  const shippingConsistency = useMemo(
    () => validateCheckoutAddressForm(shipping),
    [shipping],
  );

  const canCheckout =
    itemCount > 0 &&
    resolvedEmail.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail) &&
    billingOk &&
    shippingOk &&
    billingConsistency.ok &&
    (shipSameAsBilling || shippingConsistency.ok) &&
    shippingQuote.ok;

  useEffect(() => {
    if (!canCheckout || itemCount <= 0) return;
    trackVisitorEvent(
      {
        type: "checkout_start",
        source: getTrafficSourceForCheckout(),
        meta: { itemCount },
      },
      { dedupeKey: "checkout_start" },
    );
  }, [canCheckout, itemCount]);

  const validateCouponCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        setAppliedCoupon(null);
        setCouponError("Enter a coupon code.");
        return;
      }
      setCouponLoading(true);
      setCouponError(null);
      try {
        const res = await fetch("/api/checkout/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, totalCents: totalDueCents }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          code?: string;
          discountCents?: number;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.code || typeof data.discountCents !== "number") {
          throw new Error(data.error || "Coupon is invalid.");
        }
        setAppliedCoupon({ code: data.code, discountCents: data.discountCents });
        setCouponInput(data.code);
      } catch (e) {
        setAppliedCoupon(null);
        setCouponError(e instanceof Error ? e.message : "Coupon is invalid.");
      } finally {
        setCouponLoading(false);
      }
    },
    [totalDueCents],
  );

  useEffect(() => {
    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) {
      setAppliedCoupon(null);
      setCouponError(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void validateCouponCode(normalized);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [couponInput, totalDueCents, validateCouponCode]);

  const payloadAddresses = () => {
    const b = addressFormToRecord(billing);
    const s = shipSameAsBilling ? b : addressFormToRecord(shipping);
    return { billing: b, shipping: s };
  };

  async function payStripe() {
    setError(null);
    setLoading("stripe");
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email: resolvedEmail,
          trafficSource: getTrafficSourceForCheckout(),
          affiliatePid: getAffiliatePidForCheckout(),
          orderNotes: orderNotes.trim() || undefined,
          shippingMethod,
          couponCode: appliedCoupon?.code,
          ...payloadAddresses(),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No redirect URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  async function payPaypal() {
    setError(null);
    setLoading("paypal");
    try {
      const res = await fetch("/api/checkout/paypal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email: resolvedEmail,
          trafficSource: getTrafficSourceForCheckout(),
          affiliatePid: getAffiliatePidForCheckout(),
          orderNotes: orderNotes.trim() || undefined,
          shippingMethod,
          couponCode: appliedCoupon?.code,
          ...payloadAddresses(),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "PayPal failed");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No redirect URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-muted">
        Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
        >
          Shop catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-3xl tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        Subtotal{" "}
        <span className="font-semibold tabular-nums text-ink">
          {formatPrice(subtotal)}
        </span>
        {shippingQuote.ok && shippingUsd > 0 ? (
          <>
            {" "}
            · Shipping{" "}
            <span className="font-semibold tabular-nums text-ink">
              {formatPrice(shippingUsd)}
            </span>
          </>
        ) : shippingQuote.ok ? (
          <>
            {" "}
            ·{" "}
            {isCheckoutCountryChina(shipCountryLabel) ? (
              <span>China domestic (free shipping)</span>
            ) : (
              <span>Shipping included (no top-up)</span>
            )}
          </>
        ) : null}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-ink">
        Total due {formatPrice(discountedTotalDue)}
      </p>
      {appliedCoupon && appliedDiscountUsd > 0 ? (
        <p className="mt-1 text-sm text-emerald-800">
          Coupon {appliedCoupon.code} applied: -{formatPrice(appliedDiscountUsd)}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        <div>
          <p className="text-xs text-muted">
            Guest checkout available — no account required. Please provide full
            shipping address and phone for delivery.
          </p>
          <label
            htmlFor="checkout-email"
            className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            Email for receipt
            <span className="text-rose-600" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <input
            id="checkout-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={session?.user?.email || "you@example.com"}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          {session?.user?.email && (
            <p className="mt-1 text-xs text-muted">
              Signed in as {session.user.email}. You can override the email
              above.
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="checkout-coupon"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            Coupon code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="checkout-coupon"
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value);
                setCouponError(null);
              }}
              placeholder="Enter coupon"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void validateCouponCode(couponInput)}
              disabled={couponLoading || totalDueCents <= 0}
              className="rounded-xl border border-line bg-white/70 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {couponLoading ? "Applying…" : "Apply"}
            </button>
          </div>
          {couponError ? (
            <p className="mt-1 text-xs text-rose-700">{couponError}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {session?.user?.id && savedAddressesAvailable ? (
          <div className="rounded-xl border border-line bg-white/50 px-4 py-3 text-sm text-ink/90">
            <p className="text-muted">
              {prefillFromAccountNotice
                ? "Addresses below are filled from My Account. You can edit them before paying."
                : "You have saved addresses in My Account. Use the button to load them, or keep what you’ve typed."}
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
              onClick={() => void applyAccountAddresses(true)}
            >
              Use My Account addresses
            </button>
            <span className="mx-2 text-muted">·</span>
            <Link
              href="/account/addresses"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
            >
              Edit saved addresses
            </Link>
          </div>
        ) : null}

        <CheckoutAddressFields
          idPrefix="bill"
          title="Billing address"
          value={billing}
          onChange={setBilling}
        />

        <div className="flex items-start gap-3 rounded-xl border border-line bg-white/40 px-4 py-3">
          <input
            id="ship-same"
            type="checkbox"
            checked={shipSameAsBilling}
            onChange={(e) => {
              const on = e.target.checked;
              setShipSameAsBilling(on);
              if (on) setShipping(billing);
            }}
            className="mt-1 h-4 w-4 rounded border-line text-ink"
          />
          <label htmlFor="ship-same" className="text-sm leading-snug text-ink/90">
            <span className="font-medium">Ship to the same address</span>
            <span className="mt-0.5 block text-xs text-muted">
              Uncheck to enter a different delivery address (e.g. gift or
              workplace).
            </span>
          </label>
        </div>

        {!shipSameAsBilling ? (
          <CheckoutAddressFields
            idPrefix="ship"
            title="Shipping address"
            value={shipping}
            onChange={setShipping}
          />
        ) : null}

        <CheckoutShippingSection
          countryLabel={shipCountryLabel}
          shippingState={shipState}
          totalUnits={totalUnits}
          method={shippingMethod}
          onMethodChange={setShippingMethod}
          shippingPostalCode={shipPostalCode}
        />

        <div className="rounded-2xl border border-line bg-white/60 p-5">
          <label htmlFor="checkout-order-notes" className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Order notes{" "}
              <span className="font-normal normal-case tracking-normal text-muted">
                (optional)
              </span>
            </span>
            <textarea
              id="checkout-order-notes"
              name="orderNotes"
              rows={4}
              maxLength={2000}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Notes about your order, e.g. special notes for delivery."
              className="mt-2 w-full resize-y rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!billingConsistency.ok ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Billing address: {billingConsistency.error}
        </p>
      ) : null}
      {!shipSameAsBilling && !shippingConsistency.ok ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Shipping address: {shippingConsistency.error}
        </p>
      ) : null}

      <div className="mt-8">
        <PaymentBrandButtons
          disabled={!canCheckout}
          loading={loading}
          onStripe={payStripe}
          onPayPal={payPaypal}
        />
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="underline-offset-4 hover:underline"
        >
          Back to bag
        </button>
      </p>
    </div>
  );
}
