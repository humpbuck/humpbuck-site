import type { Prisma } from "@prisma/client";

export function parseHomeSpotlightInput(body: Record<string, unknown>): boolean {
  return body.homeSpotlight === true;
}

/** Only one product can be the homepage hero spotlight at a time. */
export async function syncExclusiveHomeSpotlight(
  tx: Prisma.TransactionClient,
  productId: string,
  enabled: boolean,
): Promise<void> {
  if (!enabled) return;
  await tx.catalogProduct.updateMany({
    where: { id: { not: productId }, homeSpotlight: true },
    data: { homeSpotlight: false },
  });
}
