import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { OrderEditShippingForm } from "@/components/account/order-edit-shipping-form";
import { parseShippingRecord } from "@/lib/admin/order-ui";
import { checkoutFormFromOrderRecord } from "@/lib/checkout-address";
import { prisma } from "@/lib/prisma";

export default async function EditOrderShippingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: {
      id: true,
      status: true,
      trackingNumber: true,
      shippingJson: true,
    },
  });
  if (!order) notFound();

  const initial = checkoutFormFromOrderRecord(
    parseShippingRecord(order.shippingJson),
  ) ?? {
    firstName: "",
    lastName: "",
    company: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States (US)",
    logisticsZone: "",
    phone: "",
    taxId: "",
  };
  const canEdit =
    (order.status === "paid" || order.status === "processing") &&
    !order.trackingNumber?.trim();

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Orders
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">
        Change shipping address
      </h1>
      <p className="mt-2 text-sm text-muted">
        Order <span className="font-mono text-ink/80">{order.id}</span>. Updates
        apply to this order only. The shop is notified by email after you save.
      </p>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <Link
          href={`/account/orders/${order.id}`}
          className="font-semibold uppercase tracking-[0.1em] text-ink underline-offset-4 hover:underline"
        >
          ← Order details
        </Link>
        <Link
          href="/account/orders"
          className="font-semibold uppercase tracking-[0.1em] text-ink underline-offset-4 hover:underline"
        >
          All orders
        </Link>
      </p>

      <OrderEditShippingForm
        orderId={order.id}
        initial={initial}
        canEdit={canEdit}
      />
    </div>
  );
}
