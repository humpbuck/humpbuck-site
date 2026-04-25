/**
 * Clean up abandoned orders (pending_payment for > 24 hours).
 * Run periodically via cron or manually: npx tsx scripts/cleanup-abandoned-orders.ts
 *
 * On Vercel, you can set up a cron job via vercel.json or call this as an API route.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ABANDONED_THRESHOLD_HOURS = 24;

async function main() {
  const cutoff = new Date(
    Date.now() - ABANDONED_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  const result = await prisma.order.updateMany({
    where: {
      status: "pending_payment",
      createdAt: { lt: cutoff },
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  console.log(
    `Soft-deleted ${result.count} abandoned order(s) older than ${ABANDONED_THRESHOLD_HOURS}h.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
