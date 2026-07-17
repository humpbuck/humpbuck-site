"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CheckoutAddressForm as CheckoutAddressFormValue } from "@/lib/checkout-address";
import { CheckoutAddressForm } from "@/components/checkout/checkout-address-form";
import { PaymentBrandButtons } from "@/components/checkout/payment-brand-buttons";
import {
  StripeCheckoutPayment,
  useStripePublishableKey,
} from "@/components/checkout/stripe-checkout-payment";

type PaymentMethodId = "stripe" | "paypal";

function CardBrandBadges() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#1a1f71]">
        VISA
      </span>
      <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#eb001b]">
        MC
      </span>
      <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#006fcf]">
        AMEX
      </span>
      <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold text-muted">
        +3
      </span>
    </span>
  );
}

function PayPalBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span className="relative inline-flex h-5 w-6 items-center justify-center">
        <span className="absolute left-0 top-0 text-[18px] font-black italic leading-none tracking-[-0.16em] text-[#003087]">
          P
        </span>
        <span className="absolute left-2 top-0 text-[18px] font-black italic leading-none tracking-[-0.16em] text-[#009CDE]">
          P
        </span>
      </span>
      <span className="text-sm font-semibold tracking-[-0.04em] text-[#003087]">PayPal</span>
    </span>
  );
}

function PaymentMethodOption({
  id,
  selected,
  onSelect,
  title,
  hint,
  badges,
  children,
  showDivider,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  hint?: string;
  badges?: React.ReactNode;
  children?: React.ReactNode;
  showDivider?: boolean;
}) {
  return (
    <div
      className={
        selected
          ? "relative z-[1] -m-px rounded-lg border-2 border-sky-600 bg-white"
          : showDivider
            ? "border-t border-line bg-white"
            : "bg-white"
      }
    >
      <button
        type="button"
        id={id}
        role="radio"
        aria-checked={selected}
        aria-expanded={selected}
        onClick={onSelect}
        className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition ${
          selected ? "bg-sky-50/80" : "hover:bg-ink/[0.02]"
        }`}
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-sky-600" : "border-muted"
          }`}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-sky-600" /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="block text-sm font-medium text-ink">{title}</span>
            {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
          </span>
          {badges}
        </span>
      </button>
      {selected && children ? (
        <div className="border-t border-sky-200 bg-[#fafafa] px-3.5 py-3.5">{children}</div>
      ) : null}
    </div>
  );
}

export function CheckoutPaymentSection({
  cartReady,
  itemCount,
  stripeClientSecret,
  stripeFormLoading,
  canPay,
  paypalLoading,
  paymentError,
  returnUrlTemplate,
  billSameAsShipping,
  onBillSameAsShippingChange,
  billing,
  onBillingChange,
  onPayPal,
  onPaymentError,
  onBeforeStripePay,
}: {
  cartReady: boolean;
  itemCount: number;
  stripeClientSecret: string | null;
  stripeFormLoading: boolean;
  canPay: boolean;
  paypalLoading: boolean;
  paymentError: string | null;
  returnUrlTemplate: string;
  billSameAsShipping: boolean;
  onBillSameAsShippingChange: (checked: boolean) => void;
  billing: CheckoutAddressFormValue;
  onBillingChange: (next: CheckoutAddressFormValue) => void;
  onPayPal: () => void;
  onPaymentError: (message: string) => void;
  onBeforeStripePay: () => Promise<string>;
}) {
  const t = useTranslations("Checkout");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("stripe");
  const { publishableKey, loading: stripeKeyLoading, error: stripeKeyError } =
    useStripePublishableKey();

  if (!cartReady || itemCount === 0) return null;

  const stripeBlocked = Boolean(stripeKeyError && !publishableKey);
  const stripeSelected = paymentMethod === "stripe";
  const paypalSelected = paymentMethod === "paypal";

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">{t("paymentHeading")}</h2>
      <p className="mt-1 text-xs text-muted">{t("paymentSecureNote")}</p>

      <div
        className="mt-4 overflow-hidden rounded-lg border border-line"
        role="radiogroup"
        aria-label={t("paymentHeading")}
      >
        <PaymentMethodOption
          id="payment-method-stripe"
          selected={stripeSelected}
          onSelect={() => setPaymentMethod("stripe")}
          title={t("paymentCardAndWallets")}
          badges={<CardBrandBadges />}
        >
          {stripeKeyLoading || stripeFormLoading ? (
            <p className="text-sm text-muted">{t("loadingPaymentForm")}</p>
          ) : null}
          {stripeBlocked ? (
            <p className="text-sm text-rose-700" role="alert">
              {stripeKeyError}
            </p>
          ) : null}
          {publishableKey && stripeClientSecret ? (
            <>
              {!canPay ? <p className="mb-3 text-xs text-muted">{t("paymentPreviewHint")}</p> : null}
              <StripeCheckoutPayment
                clientSecret={stripeClientSecret}
                publishableKey={publishableKey}
                disabled={paypalLoading}
                canSubmit={canPay}
                returnUrl={returnUrlTemplate}
                onError={onPaymentError}
                onBeforePay={onBeforeStripePay}
              />
              <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={billSameAsShipping}
                  onChange={(e) => onBillSameAsShippingChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-sky-600"
                />
                <span className="text-sm text-ink">{t("billSameAsShipping")}</span>
              </label>
              {!billSameAsShipping ? (
                <div className="mt-3 rounded-lg border border-line bg-white p-3">
                  <CheckoutAddressForm
                    title={t("billingTitle")}
                    value={billing}
                    onChange={onBillingChange}
                    idPrefix="bill-pay"
                    embedded
                  />
                </div>
              ) : null}
            </>
          ) : null}
          {!stripeKeyLoading && !stripeFormLoading && publishableKey && !stripeClientSecret ? (
            <p className="text-sm text-muted">{t("loadingPaymentForm")}</p>
          ) : null}
        </PaymentMethodOption>

        <PaymentMethodOption
          id="payment-method-paypal"
          selected={paypalSelected}
          onSelect={() => setPaymentMethod("paypal")}
          title="PayPal"
          hint={t("paymentPayPalHint")}
          badges={<PayPalBadge />}
          showDivider
        >
          <p className="mb-3 text-xs text-muted">{t("paymentPayPalContinueHint")}</p>
          <PaymentBrandButtons
            disabled={!canPay}
            loading={paypalLoading ? "paypal" : null}
            showStripe={false}
            onStripe={() => undefined}
            onPayPal={onPayPal}
          />
        </PaymentMethodOption>
      </div>

      {paymentError ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">
          {paymentError}
        </p>
      ) : null}
    </div>
  );
}
