import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BuyerAddressFieldTable } from "@/components/account/buyer-address-field-table";
import { BuyerCancelOrderActions } from "@/components/account/buyer-cancel-order";
import { BuyerOrderStatusBlock } from "@/components/account/buyer-order-status-block";
import {
  buyerOrderAddressFieldRows,
  canBuyerEditShipping,
  showBuyerCancelOrderCta,
} from "@/lib/account-buyer-order";
import {
  orderDisplayCode,
  parseShippingRecord,
  paymentProviderLabel,
} from "@/lib/admin/order-ui";
import { BuyerOrderLineItems } from "@/components/account/buyer-order-line-items";
import { formatPrice } from "@/lib/catalog";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";
import { SITE_LOCALE } from "@/lib/site-locale";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
  });
  if (!order) notFound();

  const lines = parseOrderItemsJson(order.itemsJson);
  const lineSlugs = [...new Set(lines.map((l) => l.slug))];
  const existingReviews = await prisma.productReview.findMany({
    where: {
      orderId: order.id,
      userId: session.user.id,
      productSlug: { in: lineSlugs },
    },
    select: { productSlug: true },
  });
  const reviewedProductSlugs = existingReviews.map((r) => r.productSlug);
  const totalUsd = order.totalCents / 100;
  const shipRec = parseShippingRecord(order.shippingJson);
  const billRec = parseShippingRecord(order.billingJson ?? order.shippingJson);
  const sameBillShip =
    JSON.stringify(shipRec ?? {}) === JSON.stringify(billRec ?? {});
  const showEdit = canBuyerEditShipping(order);
  const notes = order.orderNotes?.trim();
  const orderNum = orderDisplayCode(order);

  const placedAt = new Date(order.createdAt).toLocaleString(SITE_LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
  });

  const shipRows = buyerOrderAddressFieldRows(shipRec, order.email);
  const billRows = buyerOrderAddressFieldRows(billRec, order.email);

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Orders
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Order details</h1>
      <p className="mt-2 text-xs text-muted">
        <Link
          href="/account/orders"
          className="font-semibold uppercase tracking-[0.1em] text-ink underline-offset-4 hover:underline"
        >
          ← Order history
        </Link>
      </p>

      <div className="mt-8 space-y-8">
        <section className="rounded-2xl border border-line bg-white/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Placed
              </p>
              <p className="mt-1 text-sm text-ink">{placedAt}</p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Order number
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                #{orderNum}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-ink">
                {formatPrice(totalUsd)}
              </p>
              <BuyerOrderStatusBlock
                className="mt-2 text-right"
                providerLabel={paymentProviderLabel(order.provider)}
                status={order.status}
              />
            </div>
          </div>

          <h2 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Items
          </h2>
          <BuyerOrderLineItems
            lines={lines}
            linkToProduct
            className="mt-3"
            reviewContext={{
              orderId: order.id,
              orderStatus: order.status,
              reviewedProductSlugs,
            }}
          />

          {notes ? (
            <>
              <h2 className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Your notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink/85">
                {notes}
              </p>
            </>
          ) : null}

          {order.trackingNumber?.trim() ? (
            <div className="mt-6 rounded-xl border border-line bg-paper/80 px-4 py-3 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Tracking
              </p>
              <p className="mt-1">
                {order.carrier ? `${order.carrier} · ` : null}
                {order.trackingNumber}
              </p>
            </div>
          ) : null}

          <BuyerCancelOrderActions
            enabled={showBuyerCancelOrderCta(order)}
            order={{
              id: order.id,
              status: order.status,
              trackingNumber: order.trackingNumber,
            }}
            orderNum={orderNum}
          />
        </section>

        <section className="rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Shipping address
          </h2>
          <BuyerAddressFieldTable rows={shipRows} />
          {showEdit ? (
            <p className="mt-5 border-t border-line pt-4">
              <Link
                href={`/account/orders/${order.id}/edit-shipping`}
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
              >
                Change shipping address
              </Link>
            </p>
          ) : (
            <p className="mt-4 text-xs text-muted">
              Shipping address can be changed only before a tracking number is
              added, and while the order is paid or processing.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Billing address
          </h2>
          {sameBillShip ? (
            <p className="mt-3 text-sm text-ink/85">
              Same as shipping address.
            </p>
          ) : (
            <BuyerAddressFieldTable rows={billRows} />
          )}
        </section>
      </div>
    </div>
  );
}
