"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { loadPayPalSdk } from "@/lib/paypal-sdk-client";
import { preloadStripe } from "@/lib/stripe-browser";
import { peekStripePreviewClientSecret, prefetchStripePreviewClientSecret } from "@/lib/stripe-preview-intent";
import {
  PayPalExpressButton,
  type PayPalCheckoutOrderPayload,
  type PayPalPrefillPayload,
} from "@/components/cart/paypal-express-button";
import { StripeExpressCheckout } from "@/components/checkout/stripe-express-checkout";
import { useStripePublishableKey } from "@/components/checkout/stripe-checkout-payment";

export function CheckoutExpressSection({
  cartReady,
  itemCount,
  chargeUsd,
  subtotalUsd,
  stripeClientSecret,
  canPay,
  returnUrlTemplate,
  onError,
  onBeforePay,
  onPayPalPrefill,
  onCreatePayPalOrder,
  onCapturePayPalOrder,
}: {
  cartReady: boolean;
  itemCount: number;
  chargeUsd: number;
  subtotalUsd: number;
  stripeClientSecret: string | null;
  canPay: boolean;
  returnUrlTemplate: string;
  onError: (message: string) => void;
  onBeforePay: () => Promise<string>;
  onPayPalPrefill: (payload: PayPalPrefillPayload) => void;
  onCreatePayPalOrder: () => Promise<PayPalCheckoutOrderPayload>;
  onCapturePayPalOrder: (orderId: string, paypalOrderId: string) => Promise<void>;
}) {
  const t = useTranslations("Checkout");
  const { publishableKey } = useStripePublishableKey();
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";
  const cachedSecret = useMemo(
    () => peekStripePreviewClientSecret(chargeUsd),
    [chargeUsd],
  );
  const expressClientSecret = stripeClientSecret ?? cachedSecret;

  useEffect(() => {
    const pk = publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (pk) preloadStripe(pk);
  }, [publishableKey]);

  useEffect(() => {
    if (paypalClientId) void loadPayPalSdk(paypalClientId);
  }, [paypalClientId]);

  useEffect(() => {
    if (!cartReady || itemCount === 0 || chargeUsd <= 0) return;
    prefetchStripePreviewClientSecret(chargeUsd);
  }, [cartReady, itemCount, chargeUsd]);

  if (!cartReady || itemCount === 0) return null;

  return (
    <section className="space-y-3">
      <p className="text-center text-xs text-muted">{t("expressCheckout")}</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="min-h-[44px]">
          {publishableKey && expressClientSecret ? (
            <StripeExpressCheckout
              clientSecret={expressClientSecret}
              publishableKey={publishableKey}
              canSubmit={canPay}
              returnUrl={returnUrlTemplate}
              onError={onError}
              onBeforePay={onBeforePay}
            />
          ) : null}
        </div>
        <div className="min-h-[44px]">
          <PayPalExpressButton
            subtotalUsd={subtotalUsd}
            variant="checkout"
            canQuickPay={canPay}
            onPrefill={onPayPalPrefill}
            onCreatePayOrder={onCreatePayPalOrder}
            onCapturePayOrder={onCapturePayPalOrder}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">{t("orDivider")}</span>
        <div className="h-px flex-1 bg-line" />
      </div>
    </section>
  );
}
