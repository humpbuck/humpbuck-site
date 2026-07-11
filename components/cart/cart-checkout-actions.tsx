"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PayPalExpressButton } from "@/components/cart/paypal-express-button";
import { preloadStripe } from "@/lib/stripe-browser";
import { prefetchStripePreviewClientSecret } from "@/lib/stripe-preview-intent";

export function CartCheckoutActions({
  subtotalUsd,
  disabled,
  onCheckoutNavigate,
}: {
  subtotalUsd: number;
  disabled?: boolean;
  onCheckoutNavigate?: () => void;
}) {
  const t = useTranslations("Cart");

  if (disabled || subtotalUsd <= 0) return null;

  function warmCheckoutPayments() {
    const previewUsd = Math.max(0.5, subtotalUsd);
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (pk) preloadStripe(pk);
    prefetchStripePreviewClientSecret(previewUsd);
  }

  return (
    <div className="space-y-3">
      <Link
        href="/checkout"
        onClick={onCheckoutNavigate}
        onMouseEnter={warmCheckoutPayments}
        onFocus={warmCheckoutPayments}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-6 py-3.5 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
      >
        {t("checkout")}
      </Link>
      <PayPalExpressButton subtotalUsd={subtotalUsd} />
    </div>
  );
}
