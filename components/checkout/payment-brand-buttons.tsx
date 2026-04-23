"use client";

import Image from "next/image";

/**
 * Checkout payment actions styled like common WooCommerce / Stripe default patterns.
 * Brand marks are verified SVG assets in /public/checkout (Simple Icons–derived paths).
 */

function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        or
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function PaymentBrandButtons({
  disabled,
  loading,
  onStripe,
  onPayPal,
}: {
  disabled: boolean;
  loading: "stripe" | "paypal" | null;
  onStripe: () => void;
  onPayPal: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        Pay securely
      </p>

      <p className="rounded-lg border border-line/80 bg-white/60 px-3 py-2.5 text-center text-[13px] leading-relaxed text-ink/90">
        {
          "You'll complete payment on Stripe's or PayPal's secure page. We never store your full card number on this site."
        }
      </p>

      <button
        type="button"
        aria-label="Pay with card via Stripe"
        disabled={disabled || loading !== null}
        onClick={onStripe}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#635BFF] px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#5851EA] disabled:opacity-50"
      >
        {loading === "stripe" ? (
          <span>Redirecting…</span>
        ) : (
          <>
            <Image
              src="/checkout/stripe-mark.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
              unoptimized
            />
            <span className="min-[380px]:hidden font-semibold">Stripe · Card</span>
            <span className="hidden min-[380px]:inline">
              <span className="font-semibold">Stripe</span>
              <span className="font-normal text-white/95"> — Pay with card</span>
            </span>
          </>
        )}
      </button>

      <OrDivider />

      <button
        type="button"
        aria-label="Pay with PayPal"
        disabled={disabled || loading !== null}
        onClick={onPayPal}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#F2C94C] bg-[#FFC439] px-4 py-3.5 text-[15px] font-bold text-[#003087] shadow-sm transition hover:brightness-[0.98] disabled:opacity-50"
      >
        {loading === "paypal" ? (
          <span className="text-[#003087]">Redirecting…</span>
        ) : (
          <>
            <Image
              src="/checkout/paypal-mark.svg"
              alt=""
              width={28}
              height={28}
              className="h-8 w-8 shrink-0"
              unoptimized
            />
            <span className="text-lg font-bold tracking-tight text-[#003087]">
              PayPal
            </span>
          </>
        )}
      </button>

      <p className="pt-2 text-center text-[11px] leading-relaxed text-muted">
        Pay Later, Google Pay, Apple Pay, and Link often appear on the next
        secure screen, depending on your account and region.
      </p>
    </div>
  );
}
