import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { OrderEditForm } from "@/components/admin/order-edit-form";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatPrice, getProductBySlug } from "@/lib/catalog";
import {
  formatAddressLines,
  orderDisplayId,
  parseShippingRecord,
  paymentProviderLabel,
  trafficSourceLabel,
} from "@/lib/admin/order-ui";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";

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

  const lines = parseOrderItemsJson(order.itemsJson);
  const shipping = parseShippingRecord(order.shippingJson);
  const addressLines = formatAddressLines(shipping);

  const linesSubtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const remainderCents = order.totalCents - linesSubtotalCents;
  const displayId = orderDisplayId(order.id);
  const placed = new Date(order.createdAt);

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        <Link href="/admin/orders" className="hover:underline">
          Orders
        </Link>
      </p>

      <h1 className="mt-3 font-serif text-3xl tracking-tight">
        Order #{displayId} details
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        Traffic: {trafficSourceLabel(order.trafficSource)} · Payment:{" "}
        {paymentProviderLabel(order.provider)}
        {order.providerRef ? (
          <>
            {" "}
            · Ref{" "}
            <span className="font-mono text-xs text-ink/80">
              {order.providerRef}
            </span>
          </>
        ) : null}
        . Placed on {placed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
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

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            General
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Date created
              </dt>
              <dd className="mt-1">
                {placed.toLocaleDateString(undefined, {
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
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Billing & contact
          </h2>
          <div className="mt-4 space-y-2">
            <p>
              <a
                href={`mailto:${order.email}`}
                className="font-medium text-sky-800 underline-offset-2 hover:underline"
              >
                {order.email}
              </a>
            </p>
            {shipping?.phone ? (
              <p>
                <a
                  href={`tel:${shipping.phone.replace(/\s/g, "")}`}
                  className="text-sky-800 underline-offset-2 hover:underline"
                >
                  {shipping.phone}
                </a>
              </p>
            ) : (
              <p className="text-xs text-muted">Phone not provided</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Shipping address
          </h2>
          {addressLines.length > 0 ? (
            <address className="mt-4 space-y-0.5 not-italic leading-relaxed text-ink/90">
              {addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </address>
          ) : (
            <p className="mt-4 text-xs text-muted">
              No structured address was collected at checkout (email-only flow).
            </p>
          )}
        </section>
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
                  const img = product?.image;
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
                                alt=""
                                fill
                                className="object-cover"
                                sizes="64px"
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
                <dt className="text-muted">Shipping & fees</dt>
                <dd className="tabular-nums">
                  {formatPrice(remainderCents / 100)}
                </dd>
              </div>
            )}
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
          Update status, carrier, and tracking. Changes are saved in your
          database only; update PayPal or Stripe separately if required.
        </p>
        <OrderEditForm
          orderId={order.id}
          initialStatus={order.status}
          initialCarrier={order.carrier}
          initialTracking={order.trackingNumber}
        />
      </div>

      <DeleteOrderButton orderId={order.id} />
    </div>
  );
}
