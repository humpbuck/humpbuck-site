/**
 * One-off: print how many `ProductReview` rows exist per `productSlug` and totals.
 * Uses `DATABASE_URL` from `.env` / `.env.local` (Next load order).
 *
 *   npx tsx scripts/audit-product-reviews-by-slug.ts
 *
 * Compare: run with local env vs `DATABASE_URL=...` copied from Vercel (Neon) — if counts differ, you have two different databases.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const FOCUS = "digitemp-2301";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("No DATABASE_URL — set in .env.local or pass env inline.");
    process.exit(1);
  }
  const hostMatch = url.match(/@([^/?]+)/);
  const host = hostMatch?.[1] ?? "(parse failed)";

  const total = await prisma.productReview.count();
  const focus = await prisma.productReview.count({
    where: { productSlug: FOCUS },
  });

  const bySlug = await prisma.productReview.groupBy({
    by: ["productSlug"],
    _count: { _all: true },
    orderBy: { _count: { productSlug: "desc" } },
    take: 30,
  });

  console.log("DATABASE_URL host:", host);
  console.log("Total ProductReview rows:", total);
  console.log(`Count for productSlug === "${FOCUS}":`, focus);
  console.log("Top 30 slugs by review count:");
  for (const row of bySlug) {
    console.log(`  ${row.productSlug}\t${row._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
