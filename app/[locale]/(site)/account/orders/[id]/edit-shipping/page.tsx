import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { OrderEditShippingForm } from "@/components/account/order-edit-shipping-form";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
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

  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Account");

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
        {t("editShipKicker")}
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">
        {t("editShipTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t("editShipIntro", { orderId: order.id })}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <Link
          href={`/account/orders/${order.id}`}
          className="font-semibold uppercase tracking-widest text-ink underline-offset-4 hover:underline"
        >
          {t("editShipBackDetails")}
        </Link>
        <Link
          href="/account/orders"
          className="font-semibold uppercase tracking-widest text-ink underline-offset-4 hover:underline"
        >
          {t("editShipAllOrders")}
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
