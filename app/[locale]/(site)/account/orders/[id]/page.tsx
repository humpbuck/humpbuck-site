import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { BuyerAddressFieldTable } from "@/components/account/buyer-address-field-table";
import { BuyerCancelOrderActions } from "@/components/account/buyer-cancel-order";
import { BuyerOrderStatusBlock } from "@/components/account/buyer-order-status-block";
import {
  buyerOrderAddressFieldRows,
  buyerOrderStatusForLocale,
  canBuyerEditShipping,
  showBuyerCancelOrderCta,
  type BuyerAddressFieldLabels,
} from "@/lib/account-buyer-order";
import {
  orderDisplayCode,
  parseShippingRecord,
} from "@/lib/admin/order-ui";
import { BuyerOrderLineItems } from "@/components/account/buyer-order-line-items";
import { BuyerOrderDetailActions } from "@/components/account/buyer-order-detail-actions";
import { formatPrice } from "@/lib/catalog";
import { orderItemsFromOrder } from "@/lib/order-item-display";
import { prisma } from "@/lib/prisma";
import { redirectWithLocale } from "@/lib/storefront-redirect";
import { intlLocaleFromAppLocale } from "@/lib/site-locale";
import { getTaxIdRule } from "@/lib/tax-id-rules";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return redirectWithLocale(
      `/auth/login?callbackUrl=${encodeURIComponent(`/account/orders/${id}`)}`,
    );
  }

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      items: true,
    },
  });
  if (!order) notFound();

  const locale = await getLocale();
  setRequestLocale(locale);
  const intlTag = intlLocaleFromAppLocale(locale);
  const tStatus = await getTranslations("OrderStatus");
  const t = await getTranslations("Account");
  const tTax = await getTranslations("TaxId");

  const lines = orderItemsFromOrder(order as { items?: Array<{ productSlug: string; productName: string; productImage: string | null; variantId: string | null; variantLabel: string | null; variantImage: string | null; qty: number; unitPriceCents: number; lineTotalCents: number; currency: string; productSnapshotJson: string | null; }>; itemsJson?: string | null });
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

  const placedAt = new Date(order.createdAt).toLocaleString(intlTag, {
    dateStyle: "long",
    timeStyle: "short",
  });

  const addressLabels: BuyerAddressFieldLabels = {
    name: t("addressName"),
    company: t("addressCompany"),
    streetAddress: t("addressStreet"),
    city: t("addressCity"),
    stateFullName: t("addressStateFull"),
    zip: t("addressZip"),
    country: t("addressCountry"),
    phoneNumber: t("addressPhone"),
    email: t("addressEmail"),
  };

  const taxIdLabel = (countryIso2: string) => {
    const rule = getTaxIdRule(countryIso2);
    return tTax(`${rule.ruleKey}.label`);
  };

  const shipRows = buyerOrderAddressFieldRows(shipRec, order.email, addressLabels, {
    taxIdLabel,
  });
  const billRows = buyerOrderAddressFieldRows(billRec, order.email, addressLabels, {
    taxIdLabel,
  });

  const lineItemLabels = {
    reviewSubmitted: t("lineReviewSubmitted"),
    writeReview: t("lineWriteReview"),
  };

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("detailKicker")}
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">{t("detailTitle")}</h1>
      <p className="mt-2 text-xs text-muted">
        <Link
          href="/account/orders"
          className="font-semibold uppercase tracking-widest text-ink underline-offset-4 hover:underline"
        >
          {t("detailBackHistory")}
        </Link>
      </p>

      <div className="mt-8 space-y-8">
        <section className="rounded-2xl border border-line bg-white/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {t("detailPlaced")}
              </p>
              <p className="mt-1 text-sm text-ink">{placedAt}</p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {t("detailOrderNumber")}
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
                status={order.status}
                statusDisplay={buyerOrderStatusForLocale(order.status, tStatus)}
                orderStatusHeading={tStatus("heading")}
              />
            </div>
          </div>

          <h2 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("detailItems")}
          </h2>
          <BuyerOrderLineItems
            lines={lines}
            linkToProduct
            className="mt-3"
            lineItemLabels={lineItemLabels}
            reviewContext={{
              orderId: order.id,
              orderStatus: order.status,
              reviewedProductSlugs,
              hideWriteReviewLink: true,
            }}
          />

          {notes ? (
            <>
              <h2 className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {t("detailYourNotes")}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink/85">
                {notes}
              </p>
            </>
          ) : null}

          {order.trackingNumber?.trim() ? (
            <div className="mt-6 rounded-xl border border-line bg-paper/80 px-4 py-3 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {t("detailTracking")}
              </p>
              <p className="mt-1">
                {order.carrier ? `${order.carrier} · ` : null}
                {order.trackingNumber}
              </p>
            </div>
          ) : null}
          <BuyerOrderDetailActions
            orderId={order.id}
            orderStatus={order.status}
            lines={lines.map((l) => ({ slug: l.slug, name: l.name }))}
            reviewedProductSlugs={reviewedProductSlugs}
          />

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
            {t("detailShippingAddress")}
          </h2>
          <BuyerAddressFieldTable rows={shipRows} />
          {showEdit ? (
            <p className="mt-5 border-t border-line pt-4">
              <Link
                href={`/account/orders/${order.id}/edit-shipping`}
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
              >
                {t("detailChangeShipping")}
              </Link>
            </p>
          ) : (
            <p className="mt-4 text-xs text-muted">
              {t("detailShippingLocked")}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white/60 p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("detailBillingAddress")}
          </h2>
          {sameBillShip ? (
            <p className="mt-3 text-sm text-ink/85">
              {t("detailSameAsShipping")}
            </p>
          ) : (
            <BuyerAddressFieldTable rows={billRows} />
          )}
        </section>
      </div>
    </div>
  );
}
