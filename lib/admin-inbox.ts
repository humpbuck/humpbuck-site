import { prisma } from "@/lib/prisma";
import { orderItemsFromOrder } from "@/lib/order-item-display";

export const ADMIN_INBOX_CATEGORY = {
  order: "order",
  dispute: "dispute",
  subscribe: "subscribe",
  emailMockupRequest: "email_mockup_request",
  contactSupport: "contact_support",
  productReview: "product_review",
} as const;

export type AdminInboxCategory =
  (typeof ADMIN_INBOX_CATEGORY)[keyof typeof ADMIN_INBOX_CATEGORY];

export function adminInboxCategoryLabel(category: string): string {
  if (category === ADMIN_INBOX_CATEGORY.order) return "Orders";
  if (category === ADMIN_INBOX_CATEGORY.dispute) return "Orders";
  if (category === ADMIN_INBOX_CATEGORY.subscribe) return "Subscribe";
  if (category === ADMIN_INBOX_CATEGORY.emailMockupRequest) return "Email mockup request";
  if (category === ADMIN_INBOX_CATEGORY.contactSupport) return "Contact form";
  if (category === ADMIN_INBOX_CATEGORY.productReview) return "Reviews";
  return category;
}

export async function createAdminInboxMessage(input: {
  category: AdminInboxCategory;
  dedupeKey?: string;
  sourceEmail?: string | null;
  payload: Record<string, unknown>;
}) {
  return prisma.adminInboxMessage
    .create({
      data: {
        category: input.category,
        dedupeKey: input.dedupeKey?.trim() || null,
        status: "pending",
        sourceEmail: input.sourceEmail?.trim() || null,
        payloadJson: JSON.stringify(input.payload ?? {}),
      },
      select: { id: true },
    })
    .catch(() => null);
}

type AdminInboxCreateRow = {
  category: string;
  dedupeKey: string | null;
  status: string;
  sourceEmail: string | null;
  payloadJson: string;
};

/** SQLite/D1 does not support `createMany({ skipDuplicates })` — filter by dedupeKey first. */
async function createManyAdminInboxMessagesDeduped(rows: AdminInboxCreateRow[]): Promise<void> {
  if (rows.length === 0) return;
  const keys = rows.map((r) => r.dedupeKey).filter((k): k is string => Boolean(k));
  if (keys.length === 0) {
    await prisma.adminInboxMessage.createMany({ data: rows }).catch(() => null);
    return;
  }
  const existing = await prisma.adminInboxMessage
    .findMany({
      where: { dedupeKey: { in: keys } },
      select: { dedupeKey: true },
    })
    .catch(() => []);
  const seen = new Set(existing.map((e) => e.dedupeKey).filter(Boolean));
  const fresh = rows.filter((r) => !r.dedupeKey || !seen.has(r.dedupeKey));
  if (fresh.length === 0) return;
  await prisma.adminInboxMessage.createMany({ data: fresh }).catch(() => null);
}

export async function markAdminInboxCategoryRead(category: string, readAt = new Date()) {
  await prisma.adminInboxReadCursor
    .upsert({
      where: { category },
      create: { category, readAt },
      update: { readAt },
    })
    .catch(() => null);
}

export async function syncSystemInboxMessages() {
  const [paidOrders, cancelledOrders] = await Promise.all([
    prisma.order
      .findMany({
        where: {
          deletedAt: null,
          status: "paid",
        },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true,
          email: true,
          items: {
            select: {
              productSlug: true,
              productName: true,
              productImage: true,
              variantId: true,
              variantLabel: true,
              variantImage: true,
              qty: true,
              unitPriceCents: true,
              lineTotalCents: true,
              currency: true,
              productSnapshotJson: true,
            },
          },
          merchantOrderCode: true,
          createdAt: true,
        },
      })
      .catch(() => []),
    prisma.order
      .findMany({
        where: {
          deletedAt: null,
          status: "cancelled",
        },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true,
          email: true,
          items: {
            select: {
              productSlug: true,
              productName: true,
              productImage: true,
              variantId: true,
              variantLabel: true,
              variantImage: true,
              qty: true,
              unitPriceCents: true,
              lineTotalCents: true,
              currency: true,
              productSnapshotJson: true,
            },
          },
          merchantOrderCode: true,
          createdAt: true,
        },
      })
      .catch(() => []),
  ]);

  const toPayload = async (order: {
    id: string;
    email: string;
    items?: Array<{
      productSlug: string;
      productName: string;
      productImage: string | null;
      variantId: string | null;
      variantLabel: string | null;
      variantImage: string | null;
      qty: number;
      unitPriceCents: number;
      lineTotalCents: number;
      currency: string;
      productSnapshotJson: string | null;
    }>;
    merchantOrderCode: string | null;
    createdAt: Date;
  }) => {
    const lines = orderItemsFromOrder(order);
    const first = lines[0];
    const linePreviews = lines.map((line) => {
      const lineImage = line.variantImage ?? "";
      return {
        name: line.name || "Order item",
        variant: line.variantLabel || "Default",
        variantId: line.variantId || "",
        slug: line.slug || "",
        qty: line.qty || 1,
        image: lineImage,
      };
    });
    const firstPreview = linePreviews[0];
    return {
      orderId: order.id,
      merchantOrderCode: order.merchantOrderCode ?? "",
      email: order.email,
      createdAt: order.createdAt.toISOString(),
      itemName: firstPreview?.name ?? first?.name ?? "Order item",
      itemVariant: firstPreview?.variant ?? first?.variantLabel ?? "",
      itemQty: firstPreview?.qty ?? first?.qty ?? 1,
      itemImage: firstPreview?.image ?? "",
      itemVariantId: firstPreview?.variantId ?? first?.variantId ?? "",
      itemCount: linePreviews.length || 1,
      itemsPreviewJson: JSON.stringify(linePreviews),
      itemSlug: first?.slug ?? "",
    };
  };

  const rows = await Promise.all([
    ...paidOrders.map(async (o) => ({
      category: ADMIN_INBOX_CATEGORY.order as AdminInboxCategory,
      dedupeKey: `order_paid:${o.id}`,
      sourceEmail: o.email,
      payload: await toPayload(o),
    })),
    ...cancelledOrders.map(async (o) => ({
      category: ADMIN_INBOX_CATEGORY.order as AdminInboxCategory,
      dedupeKey: `order_cancelled:${o.id}`,
      sourceEmail: o.email,
      payload: await toPayload(o),
    })),
  ]);

  if (rows.length === 0) return;
  await Promise.all(
    rows.map((r) =>
      prisma.adminInboxMessage
        .updateMany({
          where: { dedupeKey: r.dedupeKey },
          data: {
            sourceEmail: r.sourceEmail ?? null,
            payloadJson: JSON.stringify(r.payload),
          },
        })
        .catch(() => null),
    ),
  );
  await prisma.adminInboxMessage
    .updateMany({
      where: { category: ADMIN_INBOX_CATEGORY.dispute, status: "pending" },
      data: { status: "handled", handledAt: new Date() },
    })
    .catch(() => null);
  await createManyAdminInboxMessagesDeduped(
    rows.map((r) => ({
      category: r.category,
      dedupeKey: r.dedupeKey,
      status: "pending",
      sourceEmail: r.sourceEmail ?? null,
      payloadJson: JSON.stringify(r.payload),
    })),
  );
  await syncPendingProductReviewInboxMessages();
}

export async function notifyAdminInboxProductReview(input: {
  reviewId: string;
  productSlug: string;
  productName?: string | null;
  rating: number;
  body: string;
  buyerEmail?: string | null;
}): Promise<void> {
  const productName = input.productName?.trim() || input.productSlug;
  const bodyPreview =
    input.body.trim().length > 160
      ? `${input.body.trim().slice(0, 160)}…`
      : input.body.trim();
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.productReview,
    dedupeKey: `product_review:${input.reviewId}`,
    sourceEmail: input.buyerEmail,
    payload: {
      reviewId: input.reviewId,
      productSlug: input.productSlug,
      productName,
      rating: input.rating,
      bodyPreview,
      message: `New product review | ${productName} · ${input.rating}★`,
    },
  });
}

export async function markProductReviewInboxHandled(reviewId: string): Promise<void> {
  await prisma.adminInboxMessage
    .updateMany({
      where: {
        category: ADMIN_INBOX_CATEGORY.productReview,
        dedupeKey: `product_review:${reviewId}`,
      },
      data: { status: "handled", handledAt: new Date() },
    })
    .catch(() => null);
}

/** Backfill inbox rows for pending reviews (badge + Message inbox). */
export async function syncPendingProductReviewInboxMessages(): Promise<void> {
  const pending = await prisma.productReview
    .findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        productSlug: true,
        rating: true,
        body: true,
        user: { select: { email: true } },
      },
    })
    .catch(() => []);

  if (pending.length === 0) return;

  await createManyAdminInboxMessagesDeduped(
    pending.map((r) => {
      const bodyPreview =
        r.body.trim().length > 160 ? `${r.body.trim().slice(0, 160)}…` : r.body.trim();
      return {
        category: ADMIN_INBOX_CATEGORY.productReview,
        dedupeKey: `product_review:${r.id}`,
        status: "pending" as const,
        sourceEmail: r.user?.email?.trim() || null,
        payloadJson: JSON.stringify({
          reviewId: r.id,
          productSlug: r.productSlug,
          productName: r.productSlug,
          rating: r.rating,
          bodyPreview,
          message: `New product review | ${r.productSlug} · ${r.rating}★`,
        }),
      };
    }),
  );
}

