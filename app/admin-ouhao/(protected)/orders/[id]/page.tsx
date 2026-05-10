import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminPath } from "@/lib/admin-path";
import { notFound } from "next/navigation";
import { AdminRefundButton } from "@/components/admin/admin-refund-button";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { OrderEditForm } from "@/components/admin/order-edit-form";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatPrice, getCartLineImage, getProductBySlug } from "@/lib/catalog";
import { getR2VariantLineImageUrl } from "@/lib/r2-line-image";
import type { StructuredShippingAddress } from "@/lib/admin/order-ui";
import {
  formatAddressLines,
  formatPhoneInternational,
  orderDisplayCode,
  parseShippingRecord,
  parseStructuredShipping,
  paymentProviderLabel,
  trafficSourceLabel,
} from "@/lib/admin/order-ui";
import { LogisticsReferencePanel } from "@/components/admin/logistics-reference-panel";
import {
  CNY_PER_USD,
  isShippingMethodId,
  quoteCheckoutShipping,
} from "@/lib/checkout-shipping-quote";
import { findPostalZone } from "@/lib/global-postal-zones";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";
import { SITE_LOCALE } from "@/lib/site-locale";

function customerHeading(order: {
  userId: string | null;
  user: {
    email: string | null;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}): string {
  if (!order.userId || !order.user) return "Guest";
  const n =
    order.user.name ||
    [order.user.firstName, order.user.lastName].filter(Boolean).join(" ").trim();
  if (n) return n;
  return "Registered";
}

function OrderAddressFieldTable({
  orderEmail,
  structured,
  phoneIntl,
  includeYanwenZoneRow = false,
  yanwenZoneValue,
}: {
  orderEmail: string;
  structured: StructuredShippingAddress | null;
  phoneIntl: ReturnType<typeof formatPhoneInternational>;
  includeYanwenZoneRow?: boolean;
  yanwenZoneValue?: string | null;
}) {
  const s = structured;
  const rows = [
    ["Name", s?.name ?? "—"],
    ["Company", s?.company ?? "—"],
    ["Street Address", s?.streetAddress ?? "—"],
    ["City", s?.city ?? "—"],
    ["State (Full Name)", s?.stateFullName ?? "—"],
    ["ZIP Code", s?.zip ?? "—"],
    ["Country", s?.country ?? "—"],
    ...(includeYanwenZoneRow
      ? ([
          [
            "Shipping price zone (1–4)",
            (yanwenZoneValue ?? "").trim() || "—",
          ],
        ] as const)
      : []),
    ["Phone Number", phoneIntl?.display ?? "Not provided"],
    ["Email", orderEmail],
  ] as const;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-2 pr-4 font-semibold text-ink">Field name</th>
            <th className="py-2 font-semibold text-ink">Content</th>
          </tr>
        </thead>
        <tbody className="text-ink/90">
          {rows.map(([label, value]) => (
            <tr
              key={label}
              className="border-b border-line/70 last:border-0"
            >
              <td className="align-top py-2.5 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {label}
              </td>
              <td className="py-2.5">
                {label === "Phone Number" && phoneIntl ? (
                  <a
                    href={phoneIntl.telHref}
                    className="text-sky-800 underline-offset-2 hover:underline"
                  >
                    {phoneIntl.display}
                  </a>
                ) : label === "Email" ? (
                  <a
                    href={`mailto:${orderEmail}`}
                    className="font-medium text-sky-800 underline-offset-2 hover:underline"
                  >
                    {orderEmail}
                  </a>
                ) : (
                  value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  if (!order) notFound();

  const lines = await parseOrderItemsJson(order.itemsJson);
  /** Legacy orders only had `shippingJson`; treat as both billing & shipping. */
  const billingRaw = parseShippingRecord(
    order.billingJson ?? order.shippingJson,
  );
  const shipping = parseShippingRecord(order.shippingJson);
  const addressLines = formatAddressLines(shipping);
  const structuredBilling = parseStructuredShipping(billingRaw);
  const structuredShipping = parseStructuredShipping(shipping);
  const billingPhoneHint =
    structuredBilling?.country ?? billingRaw?.country ?? undefined;
  const shippingPhoneHint =
    structuredShipping?.country ?? shipping?.country ?? undefined;
  const phoneIntlBilling = formatPhoneInternational(
    billingRaw?.phone,
    billingPhoneHint,
  );
  const phoneIntlShipping = formatPhoneInternational(
    shipping?.phone,
    shippingPhoneHint,
  );

  const linesSubtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const orderTotalUnits = lines.reduce((s, l) => s + l.qty, 0);
  const logisticsCountry =
    (shipping?.country ?? billingRaw?.country ?? "").trim() ||
    "United States (US)";
  const logisticsYanwenZone =
    (shipping?.logisticsZone ?? "").trim() || null;
  const logisticsPostal =
    (shipping?.postalCode ?? shipping?.zip ?? "").trim() || null;
  const logisticsState = (shipping?.state ?? "").trim() || null;
  const shippingIso = shipping?.country?.trim().toUpperCase() || null;
  const shippingZoneDisplay = shippingIso && logisticsPostal ? findPostalZone(shippingIso, logisticsPostal)?.zone ?? logisticsYanwenZone : logisticsYanwenZone;
  const checkoutShippingMethodRaw = String(
    shipping?.shippingMethod ?? "",
  ).trim();
  const checkoutShippingMethodParsed = isShippingMethodId(
    checkoutShippingMethodRaw,
  )
    ? checkoutShippingMethodRaw
    : null;
  const shippingRecalcQuote =
    checkoutShippingMethodParsed && orderTotalUnits > 0
      ? quoteCheckoutShipping({
          countryLabel: logisticsCountry,
          totalUnits: orderTotalUnits,
          method: checkoutShippingMethodParsed,
          state: logisticsState,
          postalCode: logisticsPostal,
          weightKg: orderTotalUnits * 0.2,
        })
      : null;
  const storedShippingEstimateCny = (() => {
    const raw = shipping?.shippingEstimateCny?.trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();
  const remainderCents = order.totalCents - linesSubtotalCents;
  const shippingRecalcMismatch =
    shippingRecalcQuote?.ok === true &&
    Math.abs(shippingRecalcQuote.shippingUsdCents - remainderCents) > 0;
  const displayId = orderDisplayCode(order);
  const placed = new Date(order.createdAt);
  const refundProviderOk =
    order.provider.toLowerCase() === "stripe" ||
    order.provider.toLowerCase() === "paypal";
  const canRefund =
    order.status !== "pending_payment" &&
    order.status !== "refunded" &&
    Boolean(order.providerRef?.trim()) &&
    refundProviderOk;
  const refundDisabledReason = !refundProviderOk
    ? "Refunds from the admin panel are only available for Stripe and PayPal."
    : order.status === "refunded"
      ? "This order is already refunded."
      : order.status === "pending_payment"
        ? "No payment has been captured yet."
        : !order.providerRef?.trim()
          ? "No payment reference — cannot refund (e.g. test/manual order)."
          : null;

  return (
    <div>
      <Link
        href={adminPath("/orders")}
        className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={2} className="shrink-0" aria-hidden />
        Orders
      </Link>

      <h1 className="mt-3 font-serif text-3xl tracking-tight">
        Order #{displayId} details
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        Traffic: {trafficSourceLabel(order.trafficSource)} · Payment:{" "}
        {paymentProviderLabel(order.provider)}
        {order.affiliateAttribution ? (
          <>
            {" "}
            · Affiliate{" "}
            <span className="font-medium text-emerald-900">
              {order.affiliateAttribution}
              {order.affiliatePid ? ` (${order.affiliatePid})` : ""}
            </span>
          </>
        ) : null}
        {order.providerRef ? (
          <>
            {" "}
            · Ref{" "}
            <span className="font-mono text-xs text-ink/80">
              {order.providerRef}
            </span>
          </>
        ) : null}
        . Placed on {placed.toLocaleString(SITE_LOCALE, { dateStyle: "medium", timeStyle: "short" })}
        . Customer: {customerHeading(order)}
        {order.user?.email ? (
          <>
            {" "}
            ({order.user.email})
          </>
        ) : (
          <> ({order.email})</>
        )}
        .
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            General
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Date created
              </dt>
              <dd className="mt-1">
                {placed.toLocaleDateString(SITE_LOCALE, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Status
              </dt>
              <dd className="mt-1">
                <OrderStatusBadge status={order.status} />
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Customer
              </dt>
              <dd className="mt-1">{customerHeading(order)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Traffic source
              </dt>
              <dd className="mt-1">{trafficSourceLabel(order.trafficSource)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Payment method
              </dt>
              <dd className="mt-1">{paymentProviderLabel(order.provider)}</dd>
            </div>
            {order.orderNotes?.trim() ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Order notes
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-ink/90">
                  {order.orderNotes.trim()}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Billing address
            </h2>
            <OrderAddressFieldTable
              orderEmail={order.email}
              structured={structuredBilling}
              phoneIntl={phoneIntlBilling}
            />
          </section>

          <section className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Shipping address
            </h2>
            <OrderAddressFieldTable
              orderEmail={order.email}
              structured={structuredShipping}
              phoneIntl={phoneIntlShipping}
              includeYanwenZoneRow={Boolean(shippingZoneDisplay)}
              yanwenZoneValue={shippingZoneDisplay}
            />
            {!structuredShipping && addressLines.length > 0 ? (
              <address className="mt-4 space-y-0.5 border-t border-line/80 pt-4 not-italic text-xs leading-relaxed text-muted">
                <p className="font-semibold text-[10px] uppercase tracking-[0.12em]">
                  Legacy lines on file
                </p>
                {addressLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </address>
            ) : null}
          </section>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(260px,320px)] lg:items-start">
        <div>
          <h2 className="font-serif text-xl tracking-tight">Line items</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line/80 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const product = getProductBySlug(line.slug);
                  const img =
                    getR2VariantLineImageUrl(line.slug, line.variantId) ??
                    (product ? getCartLineImage(product, line.variantId) : undefined);
                  return (
                    <tr
                      key={`${line.slug}-${i}`}
                      className="border-b border-line/50 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="flex gap-4">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-line">
                            {img ? (
                              <Image
                                src={img}
                                alt={
                                  line.variantLabel
                                    ? `${line.name} — ${line.variantLabel}`
                                    : line.name
                                }
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/product/${line.slug}`}
                              className="font-medium text-sky-800 underline-offset-2 hover:underline"
                            >
                              {line.name}
                            </Link>
                            <p className="mt-1 font-mono text-[11px] text-muted">
                              SKU {line.slug.toUpperCase()}
                              {line.variantId
                                ? ` · Var ${line.variantId}`
                                : ""}
                            </p>
                            {line.variantLabel ? (
                              <p className="mt-0.5 text-xs text-muted">
                                {line.variantLabel}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-muted">
                        {formatPrice(line.unitAmountCents / 100)}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">
                        {line.qty}
                      </td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums">
                        {formatPrice(line.lineTotalCents / 100)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Order totals
          </h2>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Items subtotal</dt>
              <dd className="tabular-nums">
                {formatPrice(linesSubtotalCents / 100)}
              </dd>
            </div>
            {remainderCents > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Shipping & fees (paid)</dt>
                <dd className="tabular-nums">
                  {formatPrice(remainderCents / 100)}
                </dd>
              </div>
            )}
            {shippingRecalcQuote?.ok ? (
              <div className="flex justify-between gap-4 text-[13px]">
                <dt className="text-muted">
                  Shipping recalc
                  {checkoutShippingMethodParsed ? (
                    <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-muted">
                      {checkoutShippingMethodParsed} · postcode + tables
                    </span>
                  ) : null}
                </dt>
                <dd className="tabular-nums text-ink">
                  {formatPrice(shippingRecalcQuote.shippingUsdCents / 100)}
                  <span className="mt-0.5 block text-[10px] font-normal text-muted">
                    ≈ ¥{shippingRecalcQuote.shippingCny.toFixed(2)} top-up
                  </span>
                </dd>
              </div>
            ) : shippingRecalcQuote && !shippingRecalcQuote.ok ? (
              <p className="text-[11px] leading-relaxed text-amber-900">
                Recalc: {shippingRecalcQuote.error}
              </p>
            ) : null}
            {storedShippingEstimateCny != null ? (
              <p className="text-[11px] text-muted">
                Stored at checkout: ≈¥{storedShippingEstimateCny.toFixed(2)}{" "}
                int’l leg (CNY)
              </p>
            ) : null}
            {shippingRecalcMismatch ? (
              <p className="text-[11px] leading-relaxed text-amber-900">
                Recalculated shipping differs from the paid remainder — rate
                table, FX ({CNY_PER_USD} CNY/USD), or
                order age may explain the gap.
              </p>
            ) : null}
            {remainderCents < 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Adjustments</dt>
                <dd className="tabular-nums">
                  {formatPrice(remainderCents / 100)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-line pt-3 font-semibold">
              <dt>Order total</dt>
              <dd className="tabular-nums">
                {formatPrice(order.totalCents / 100)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 text-muted">
              <dt>Paid</dt>
              <dd className="tabular-nums">
                {order.status === "pending_payment"
                  ? "—"
                  : formatPrice(order.totalCents / 100)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Stripe fees and net payout are not stored here—see your Stripe
            Dashboard for balance transactions linked to this payment.
          </p>
        </aside>
      </div>

      <div className="mt-12 border-t border-line pt-12">
        <h2 className="font-serif text-xl tracking-tight">Fulfillment</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Set a shop order number, update status, carrier, and tracking. When
          status is <span className="text-ink">Shipped</span> and both carrier
          and tracking are filled, we email the customer once with tracking
          details. Use <strong className="text-ink">Refund payment</strong>{" "}
          to issue a full refund via Stripe or PayPal.
        </p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-8">
            <OrderEditForm
              orderId={order.id}
              initialStatus={order.status}
              initialCarrier={order.carrier}
              initialTracking={order.trackingNumber}
              initialMerchantOrderCode={order.merchantOrderCode}
            />
            <AdminRefundButton
              orderId={order.id}
              totalLabel={formatPrice(order.totalCents / 100)}
              providerLabel={paymentProviderLabel(order.provider)}
              canRefund={canRefund}
              disabledReason={refundDisabledReason}
            />
          </div>
          <LogisticsReferencePanel
            shippingCountryLabel={logisticsCountry}
            shippingState={logisticsState}
            totalUnits={orderTotalUnits}
            postalCode={logisticsPostal}
            yanwenZone={logisticsYanwenZone}
            effectiveLaneZone={shippingZoneDisplay}
            checkoutShippingMethod={checkoutShippingMethodRaw || null}
          />
        </div>
      </div>

      <DeleteOrderButton orderId={order.id} />
    </div>
  );
}
