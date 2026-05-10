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

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  const userId = session!.user!.id;
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const from = String(sp.from ?? "").trim();
  const to = String(sp.to ?? "").trim();
  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(fromDate.getTime())) createdAtFilter.gte = fromDate;
  }
  if (to) {
    const toDate = new Date(`${to}T23:59:59.999Z`);
    if (!Number.isNaN(toDate.getTime())) createdAtFilter.lte = toDate;
  }
  const hasCreatedAtFilter = Boolean(createdAtFilter.gte || createdAtFilter.lte);

  const orders = await prisma.order.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { id: { contains: q } },
              { merchantOrderCode: { contains: q } },
              { trackingNumber: { contains: q } },
            ],
          }
        : {}),
      ...(hasCreatedAtFilter ? { createdAt: createdAtFilter } : {}),
    },
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
      <form method="get" className="mt-6 grid gap-2 md:grid-cols-[1fr_180px_180px_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Email, order code, track #..."
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90"
        >
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white/60 p-8 text-center text-sm text-muted">
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
          {await Promise.all(
            orders.map(async (order, index) => {
              const lines = await parseOrderItemsJson(order.itemsJson);
              const totalUsd = order.totalCents / 100;
              return (
                <li
                  key={`${order.id}-${index}`}
                  className="rounded-2xl border border-line bg-white/60 p-5"
                >
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="block rounded-xl outline-none ring-ink/20 focus-visible:ring-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
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
            }),
          )}
        </ul>
      )}
    </div>
  );
}
