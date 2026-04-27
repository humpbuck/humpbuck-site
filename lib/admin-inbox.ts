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
