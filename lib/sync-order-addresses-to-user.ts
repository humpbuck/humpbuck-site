import { prisma } from "@/lib/prisma";
import { normalizeUserAddressInput } from "@/lib/user-address-normalize";

function parseJsonRecord(s: string | null | undefined): unknown {
  if (!s?.trim()) return null;
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

/**
 * After a successful purchase, copy billing/shipping from the order into the buyer's
 * saved addresses. No-op when `userId` is missing (guest checkout).
 */
export async function syncOrderAddressesToUserAccount(
  userId: string,
  billingJson: string | null | undefined,
  shippingJson: string | null | undefined,
): Promise<void> {
  const billing = normalizeUserAddressInput(parseJsonRecord(billingJson ?? null));
  if (billing) {
    await prisma.userAddress.upsert({
      where: { userId_type: { userId, type: "billing" } },
      create: { userId, type: "billing", ...billing },
      update: billing,
    });
  }

  const shipping = normalizeUserAddressInput(parseJsonRecord(shippingJson ?? null));
  if (shipping) {
    await prisma.userAddress.upsert({
      where: { userId_type: { userId, type: "shipping" } },
      create: { userId, type: "shipping", ...shipping },
      update: shipping,
    });
  }
}
