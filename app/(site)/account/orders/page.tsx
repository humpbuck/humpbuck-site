import Link from "next/link";
import { auth } from "@/auth";
import { formatPrice } from "@/lib/catalog";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { prisma } from "@/lib/prisma";

function statusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending_payment":
      return "Pending";
    default:
      return status;
  }
}

export default async function AccountOrdersPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
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
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--color-line)] pb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      {new Date(order.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Order ID · {order.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatPrice(totalUsd)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                      {order.provider} · {statusLabel(order.status)}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-ink/85">
                  {lines.map((line, li) => (
                    <li key={`${order.id}-${line.slug}-${li}`}>
                      {line.name}
                      {line.variantLabel ? ` — ${line.variantLabel}` : ""} ×{" "}
                      {line.qty}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
