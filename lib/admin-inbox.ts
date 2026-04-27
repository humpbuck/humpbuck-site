import { prisma } from "@/lib/prisma";
import { parseOrderItemsJson } from "@/lib/parse-order-items";
import { getCartLineImage, getProductBySlug } from "@/lib/catalog";

export const ADMIN_INBOX_CATEGORY = {
  order: "order",
  dispute: "dispute",
  affiliates: "affiliates",
  subscribe: "subscribe",
  emailMockupRequest: "email_mockup_request",
} as const;

export type AdminInboxCategory =
  (typeof ADMIN_INBOX_CATEGORY)[keyof typeof ADMIN_INBOX_CATEGORY];

export function adminInboxCategoryLabel(category: string): string {
  if (category === ADMIN_INBOX_CATEGORY.order) return "Orders";
  if (category === ADMIN_INBOX_CATEGORY.dispute) return "Orders";
  if (category === ADMIN_INBOX_CATEGORY.affiliates) return "Affiliates";
  if (category === ADMIN_INBOX_CATEGORY.subscribe) return "Subscribe";
  if (category === ADMIN_INBOX_CATEGORY.emailMockupRequest) return "Email mockup request";
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
          itemsJson: true,
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
          itemsJson: true,
          merchantOrderCode: true,
          createdAt: true,
        },
      })
      .catch(() => []),
  ]);

  const toPayload = (order: {
    id: string;
    email: string;
    itemsJson: string;
    merchantOrderCode: string | null;
    createdAt: Date;
  }) => {
    const lines = parseOrderItemsJson(order.itemsJson);
    const first = lines[0];
    const linePreviews = lines.map((line) => {
      const product = line.slug ? getProductBySlug(line.slug) : null;
      const lineImage = product ? getCartLineImage(product, line.variantId) : "";
      return {
        name: line.name || product?.name || "Order item",
        variant: line.variantLabel || "Default",
        variantId: line.variantId || "",
        slug: line.slug || "",
        qty: line.qty || 1,
        image: lineImage || product?.image || "",
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

  const rows = [
    ...paidOrders.map((o) => ({
      category: ADMIN_INBOX_CATEGORY.order as AdminInboxCategory,
      dedupeKey: `order_paid:${o.id}`,
      sourceEmail: o.email,
      payload: { ...toPayload(o), eventType: "paid" },
    })),
    ...cancelledOrders.map((o) => ({
      category: ADMIN_INBOX_CATEGORY.order as AdminInboxCategory,
      dedupeKey: `order_cancelled:${o.id}`,
      sourceEmail: o.email,
      payload: { ...toPayload(o), eventType: "cancelled" },
    })),
  ];

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
  await prisma.adminInboxMessage
    .createMany({
      data: rows.map((r) => ({
        category: r.category,
        dedupeKey: r.dedupeKey,
        status: "pending",
        sourceEmail: r.sourceEmail ?? null,
        payloadJson: JSON.stringify(r.payload),
      })),
      skipDuplicates: true,
    })
    .catch(() => null);
}
