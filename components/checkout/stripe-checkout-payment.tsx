"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";
import { getStripePromise } from "@/lib/stripe-browser";

function StripePayButton({
  disabled,
  canSubmit,
  returnUrl,
  onError,
  onSubmittingChange,
  onBeforePay,
}: {
  disabled: boolean;
  canSubmit: boolean;
  returnUrl: string;
  onError: (message: string) => void;
  onSubmittingChange: (submitting: boolean) => void;
  onBeforePay: () => Promise<string>;
}) {
  const t = useTranslations("Checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  async function handlePay() {
    if (!stripe || !elements || disabled) return;
    if (!canSubmit) {
      onError(t("completeDetailsToPay"));
      return;
    }
    onError("");
    onSubmittingChange(true);
    try {
      const orderId = await onBeforePay();
      const resolvedReturnUrl = returnUrl.replace("{ORDER_ID}", encodeURIComponent(orderId));
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: resolvedReturnUrl.replace("{PAYMENT_INTENT_ID}", "") },
        redirect: "if_required",
      });
      if (error) {
        onError(error.message ?? t("stripeError"));
        onSubmittingChange(false);
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        window.location.assign(
          resolvedReturnUrl.replace("{PAYMENT_INTENT_ID}", paymentIntent.id),
        );
        return;
      }
      onSubmittingChange(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : t("stripeError"));
      onSubmittingChange(false);
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
          wallets: {
            applePay: "auto",
            googlePay: "auto",
            link: "auto",
          },
        }}
      />
      <button
        type="button"
        disabled={!stripe || !elements || !ready || disabled}
        onClick={() => void handlePay()}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-ink px-5 text-center text-sm font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {t("payNow")}
      </button>
    </div>
  );
}

export function StripeCheckoutPayment({
  clientSecret,
  publishableKey,
  disabled,
  canSubmit,
  returnUrl,
  onError,
  onBeforePay,
}: {
  clientSecret: string;
  publishableKey: string;
  disabled: boolean;
  canSubmit: boolean;
  returnUrl: string;
  onError: (message: string) => void;
  onBeforePay: () => Promise<string>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const stripePromise = useMemo(
    () => getStripePromise(publishableKey),
    [publishableKey],
  );
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#111111",
        borderRadius: "12px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options} key={`pay-${clientSecret}`}>
      <StripePayButton
        disabled={disabled || submitting}
        canSubmit={canSubmit}
        returnUrl={returnUrl}
        onError={onError}
        onSubmittingChange={setSubmitting}
        onBeforePay={onBeforePay}
      />
    </Elements>
  );
}

export function useStripePublishableKey(): {
  publishableKey: string | null;
  loading: boolean;
  error: string | null;
} {
  const t = useTranslations("Checkout");
  const [publishableKey, setPublishableKey] = useState<string | null>(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null,
  );
  const [loading, setLoading] = useState(!publishableKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publishableKey) {
      void getStripePromise(publishableKey);
      if (loading) setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/checkout/stripe/config");
        const data = (await res.json()) as { ok?: boolean; publishableKey?: string; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.ok || !data.publishableKey) {
          setError(data.error || t("stripePublishableMissing"));
          return;
        }
        setPublishableKey(data.publishableKey);
      } catch {
        if (!cancelled) setError(t("stripePublishableMissing"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publishableKey, loading, t]);

  return { publishableKey, loading, error };
}
