"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { loadPayPalSdk } from "@/lib/paypal-sdk-client";
import {
  clearCheckoutPrefill,
  writeCheckoutPrefill,
} from "@/lib/checkout-prefill";

export type PayPalPrefillPayload = {
  email?: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
};

export type PayPalCheckoutOrderPayload = {
  orderId: string;
  totalUsd: number;
  returnUrl: string;
  cancelUrl: string;
};

function isPayPalUserCancelError(err: unknown): boolean {
  const message =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
  const normalized = message.toLowerCase();
  return (
    normalized.includes("popup") ||
    normalized.includes("window closed") ||
    normalized.includes("user closed") ||
    normalized.includes("closed before") ||
    normalized.includes("cancel")
  );
}

export function PayPalExpressButton({
  subtotalUsd,
  disabled,
  variant = "cart",
  canQuickPay,
  onPrefill,
  onCreatePayOrder,
  onCapturePayOrder,
}: {
  subtotalUsd: number;
  disabled?: boolean;
  variant?: "cart" | "checkout";
  canQuickPay?: boolean;
  onPrefill?: (payload: PayPalPrefillPayload) => void;
  onCreatePayOrder?: () => Promise<PayPalCheckoutOrderPayload>;
  onCapturePayOrder?: (orderId: string, paypalOrderId: string) => Promise<void>;
}) {
  const t = useTranslations(variant === "cart" ? "Cart" : "Checkout");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderNonce, setRenderNonce] = useState(0);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";
  const payOrderRef = useRef<PayPalCheckoutOrderPayload | null>(null);
  const onPrefillRef = useRef(onPrefill);
  const onCreatePayOrderRef = useRef(onCreatePayOrder);
  const onCapturePayOrderRef = useRef(onCapturePayOrder);
  const canQuickPayRef = useRef(canQuickPay);

  onPrefillRef.current = onPrefill;
  onCreatePayOrderRef.current = onCreatePayOrder;
  onCapturePayOrderRef.current = onCapturePayOrder;
  canQuickPayRef.current = canQuickPay;

  useEffect(() => {
    if (!clientId || disabled || subtotalUsd <= 0 || !containerRef.current) return;

    let cancelled = false;
    const host = containerRef.current;

    void (async () => {
      try {
        await loadPayPalSdk(clientId);
        if (cancelled || !window.paypal?.Buttons || !host) return;

        host.innerHTML = "";
        await window.paypal.Buttons({
          fundingSource: window.paypal.FUNDING.PAYPAL,
          style: {
            layout: "horizontal",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 44,
            borderRadius: 16,
            tagline: false,
          },
          createOrder: async () => {
            setError(null);
            if (variant === "checkout" && canQuickPayRef.current && onCreatePayOrderRef.current) {
              const payload = await onCreatePayOrderRef.current();
              payOrderRef.current = payload;
              const res = await fetch("/api/checkout/paypal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "create",
                  orderId: payload.orderId,
                  totalUsd: payload.totalUsd.toFixed(2),
                  returnUrl: payload.returnUrl,
                  cancelUrl: payload.cancelUrl,
                }),
              });
              const data = (await res.json()) as { ok?: boolean; paypalOrderId?: string; error?: string };
              if (!res.ok || !data.ok || !data.paypalOrderId) {
                throw new Error(data.error || t("paypalExpressError"));
              }
              return data.paypalOrderId;
            }

            const res = await fetch("/api/checkout/paypal/express", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create",
                subtotalUsd: subtotalUsd.toFixed(2),
              }),
            });
            const data = (await res.json()) as { ok?: boolean; paypalOrderId?: string; error?: string };
            if (!res.ok || !data.ok || !data.paypalOrderId) {
              throw new Error(data.error || t("paypalExpressError"));
            }
            return data.paypalOrderId;
          },
          onApprove: async (data: { orderID?: string }) => {
            const paypalOrderId = data.orderID?.trim();
            if (!paypalOrderId) throw new Error(t("paypalExpressError"));

            if (
              variant === "checkout" &&
              canQuickPayRef.current &&
              onCapturePayOrderRef.current &&
              payOrderRef.current
            ) {
              const { orderId, returnUrl } = payOrderRef.current;
              await onCapturePayOrderRef.current(orderId, paypalOrderId);
              window.location.assign(returnUrl);
              return;
            }

            const res = await fetch("/api/checkout/paypal/express", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "details", paypalOrderId }),
            });
            const payload = (await res.json()) as PayPalPrefillPayload & { ok?: boolean; error?: string };
            if (!res.ok || !payload.ok) {
              throw new Error(payload.error || t("paypalExpressError"));
            }

            if (variant === "checkout" && onPrefillRef.current) {
              onPrefillRef.current({
                email: payload.email,
                billing: payload.billing,
                shipping: payload.shipping,
              });
              return;
            }

            clearCheckoutPrefill();
            writeCheckoutPrefill({
              source: "paypal-express",
              email: payload.email,
              billing: payload.billing,
              shipping: payload.shipping,
            });
            router.push("/checkout?from=paypal-express");
          },
          onCancel: () => {
            setError(null);
            setRenderNonce((n) => n + 1);
          },
          onError: (err: unknown) => {
            if (isPayPalUserCancelError(err)) {
              setError(null);
              setRenderNonce((n) => n + 1);
              return;
            }
            setError(t("paypalExpressError"));
          },
        }).render(host);
      } catch (e) {
        if (!cancelled && !isPayPalUserCancelError(e)) {
          setError(e instanceof Error ? e.message : t("paypalExpressError"));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (host) host.innerHTML = "";
    };
  }, [clientId, disabled, renderNonce, router, subtotalUsd, t, variant]);

  if (!clientId) return null;

  return (
    <div className="overflow-hidden rounded-2xl">
      <div ref={containerRef} className="min-h-[44px]" />
      {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
