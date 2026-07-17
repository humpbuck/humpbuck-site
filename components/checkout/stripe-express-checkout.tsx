"use client";

import { useMemo } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";
import { getStripePromise } from "@/lib/stripe-browser";

function ExpressCheckoutInner({
  canSubmit,
  returnUrl,
  onError,
  onBeforePay,
}: {
  canSubmit: boolean;
  returnUrl: string;
  onError: (message: string) => void;
  onBeforePay: () => Promise<string>;
}) {
  const t = useTranslations("Checkout");
  const stripe = useStripe();
  const elements = useElements();

  return (
    <ExpressCheckoutElement
      options={{
        buttonTheme: {
          applePay: "black",
          googlePay: "black",
        },
        layout: {
          maxColumns: 1,
          maxRows: 2,
          overflow: "auto",
        },
        paymentMethods: {
          link: "auto",
          applePay: "auto",
          googlePay: "auto",
          paypal: "never",
          amazonPay: "never",
          klarna: "never",
        },
        paymentMethodOrder: ["link", "applePay", "googlePay"],
      }}
      onConfirm={async () => {
        if (!stripe || !elements) return;
        if (!canSubmit) {
          onError(t("completeDetailsToPay"));
          return;
        }
        onError("");
        try {
          const { error: submitError } = await elements.submit();
          if (submitError) {
            onError(submitError.message ?? t("stripeError"));
            return;
          }
          const orderId = await onBeforePay();
          const resolvedReturnUrl = returnUrl
            .replace("{ORDER_ID}", encodeURIComponent(orderId))
            .replace("{PAYMENT_INTENT_ID}", "");
          const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: resolvedReturnUrl },
            redirect: "if_required",
          });
          if (error) {
            onError(error.message ?? t("stripeError"));
            return;
          }
          if (paymentIntent?.status === "succeeded") {
            window.location.assign(
              returnUrl
                .replace("{ORDER_ID}", encodeURIComponent(orderId))
                .replace("{PAYMENT_INTENT_ID}", paymentIntent.id),
            );
          }
        } catch (e) {
          onError(e instanceof Error ? e.message : t("stripeError"));
        }
      }}
    />
  );
}

export function StripeExpressCheckout({
  clientSecret,
  publishableKey,
  canSubmit,
  returnUrl,
  onError,
  onBeforePay,
}: {
  clientSecret: string;
  publishableKey: string;
  canSubmit: boolean;
  returnUrl: string;
  onError: (message: string) => void;
  onBeforePay: () => Promise<string>;
}) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#111111",
        colorBackground: "#ffffff",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options} key={`express-${clientSecret}`}>
      <ExpressCheckoutInner
        canSubmit={canSubmit}
        returnUrl={returnUrl}
        onError={onError}
        onBeforePay={onBeforePay}
      />
    </Elements>
  );
}
