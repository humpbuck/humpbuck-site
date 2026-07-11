import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { formatPrice } from "@/lib/catalog";
import { orderItemsFromOrder } from "@/lib/order-item-display";
import { buyerOrderStatusForLocale } from "@/lib/account-buyer-order";
import { loadCheckoutSuccessOrder } from "@/lib/checkout-success-order";
import { finalizePaidPayPalOrder } from "@/lib/paypal-checkout-finalize";
import { intlLocaleFromAppLocale } from "@/lib/site-locale";
import { CheckoutSuccessClient } from "@/app/[locale]/(site)/checkout/success/CheckoutSuccessClient";
import { finalizePaidStripeOrder } from "@/lib/stripe-checkout-finalize";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    provider?: string;
    session_id?: string;
    payment_intent?: string;
    token?: string;
  }>;
}) {
  const sp = await searchParams;
  const orderId = sp.orderId?.trim();
  if (!orderId) notFound();

  const paypalToken =
    sp.provider === "paypal" ? sp.token?.trim() : undefined;
  const stripePaymentIntentId =
    sp.provider === "stripe" ? sp.payment_intent?.trim() : undefined;

  if (stripePaymentIntentId) {
    try {
      await finalizePaidStripeOrder(orderId, stripePaymentIntentId);
    } catch (e) {
      console.error("[checkout/success] Stripe finalize failed:", e);
    }
  }

  if (paypalToken) {
    try {
      await finalizePaidPayPalOrder(orderId, paypalToken);
    } catch (e) {
      console.error("[checkout/success] PayPal finalize failed:", e);
    }
  }

  const session = await auth();
  const order = await loadCheckoutSuccessOrder({
    orderId,
    sessionUserId: session?.user?.id,
    stripeSessionId: sp.session_id?.trim(),
    stripePaymentIntentId,
    paypalOrderId: paypalToken,
  });
  if (!order) notFound();

  const locale = await getLocale();
  const t = await getTranslations("Success");
  const tOrd = await getTranslations("OrderStatus");
  const intlTag = intlLocaleFromAppLocale(locale);
  const lines = orderItemsFromOrder(order as { items?: Array<{ productSlug: string; productName: string; productImage: string | null; variantId: string | null; variantLabel: string | null; variantImage: string | null; qty: number; unitPriceCents: number; lineTotalCents: number; currency: string; productSnapshotJson: string | null; }>; itemsJson?: string | null });
  const placedAt = new Date(order.createdAt).toLocaleString(intlTag, {
    dateStyle: "long",
    timeStyle: "short",
  });

  const purchaseAllowed = order.status === "paid" || order.status === "processing" || order.status === "shipped";
  const returnedFromPayment = Boolean(
    sp.session_id?.trim() || stripePaymentIntentId || paypalToken,
  );
  const syncCartFromPaidOrder = purchaseAllowed || returnedFromPayment;
  const paidOrderLines = lines.map((line) => ({
    slug: line.slug,
    variantId: line.variantId ?? null,
    qty: line.qty,
  }));
  const providerLabel =
    order.provider === "stripe"
      ? "Stripe"
      : order.provider === "paypal"
        ? "PayPal"
        : order.provider;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <CheckoutSuccessClient
        orderId={order.id}
        documentTitle={t("documentTitle")}
        syncCartFromPaidOrder={syncCartFromPaidOrder}
        paidOrderLines={paidOrderLines}
      />
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-0.5 text-emerald-600" size={30} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{t("paymentSuccessful")}</p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-ink">{t("orderConfirmed")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900/85">
              {t("thanksWithProvider", { provider: providerLabel })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("orderLabel")}</p>
            <p className="mt-1 text-lg font-semibold text-ink">#{order.id.slice(-8)}</p>
            <p className="mt-3 text-xs text-muted">{t("placed", { date: placedAt })}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-ink">{formatPrice(order.totalCents / 100)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
              {buyerOrderStatusForLocale(order.status, tOrd)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("items")}</p>
          <ul className="mt-3 space-y-3 text-sm text-ink/90">
            {lines.map((line) => (
              <li key={line.slug} className="flex items-center justify-between gap-4 border-b border-line/60 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium">{line.name}{line.variantLabel ? ` — ${line.variantLabel}` : ""}</p>
                  <p className="text-xs text-muted">{t("qty", { count: line.qty })}</p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">{formatPrice(line.lineTotalCents / 100)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account/orders" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90">
            {t("viewOrders")}
          </Link>
          <Link href="/product" className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/20">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
