import Link from "next/link";
import { auth } from "@/auth";
import { BuyerCancelOrderActions } from "@/components/account/buyer-cancel-order";
import { BuyerOrderStatusBlock } from "@/components/account/buyer-order-status-block";
import { showBuyerCancelOrderCta } from "@/lib/account-buyer-order";
import { orderDisplayCode } from "@/lib/admin/order-ui";
import { BuyerOrderLineItems } from "@/components/account/buyer-order-line-items";
import { formatPrice } from "@/lib/catalog";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";
import { SITE_LOCALE } from "@/lib/site-locale";

export default async function AccountOrdersPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
    select: {
      id: true,
      createdAt: true,
      status: true,
      provider: true,
      totalCents: true,
      itemsJson: true,
      trackingNumber: true,
      merchantOrderCode: true,
    },
  });

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Orders
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Order history</h1>
      <p className="mt-2 text-sm text-muted">
        Orders placed while signed in are linked to your account.
      </p>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-8 text-center text-sm text-muted">
          <p>You do not have any orders yet.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {orders.map((order, index) => {
            const lines = parseOrderItemsJson(order.itemsJson);
            const totalUsd = order.totalCents / 100;
            return (
              <li
                key={`${order.id}-${index}`}
                className="rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-5"
              >
                <Link
                  href={`/account/orders/${order.id}`}
                  className="block rounded-xl outline-none ring-ink/20 focus-visible:ring-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--color-line)] pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        {new Date(order.createdAt).toLocaleString(SITE_LOCALE, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Order #{orderDisplayCode(order)}
                        <span className="text-muted/80">
                          {" "}
                          · Ref. {order.id.slice(-8)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatPrice(totalUsd)}
                      </p>
                      <BuyerOrderStatusBlock
                        className="mt-2 text-right"
                        providerLabel={order.provider}
                        status={order.status}
                      />
                    </div>
                  </div>
                  <BuyerOrderLineItems
                    lines={lines}
                    compact
                    className="mt-4 text-ink/85"
                  />
                  <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4">
                    View order details →
                  </p>
                </Link>
                <BuyerCancelOrderActions
                  enabled={showBuyerCancelOrderCta(order)}
                  order={{
                    id: order.id,
                    status: order.status,
                    trackingNumber: order.trackingNumber,
                  }}
                  orderNum={orderDisplayCode(order)}
                  compact
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
