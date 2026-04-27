import { prisma } from "@/lib/prisma";

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
  if (category === ADMIN_INBOX_CATEGORY.dispute) return "After-sales disputes";
  if (category === ADMIN_INBOX_CATEGORY.affiliates) return "Affiliates";
  if (category === ADMIN_INBOX_CATEGORY.subscribe) return "Subscribe";
  if (category === ADMIN_INBOX_CATEGORY.emailMockupRequest) return "Email mockup request";
  return category;
}

export async function createAdminInboxMessage(input: {
  category: AdminInboxCategory;
  sourceEmail?: string | null;
  payload: Record<string, unknown>;
}) {
  return prisma.adminInboxMessage
    .create({
      data: {
        category: input.category,
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
