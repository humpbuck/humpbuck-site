/**
 * Clear old Unsplash/DiceBear (or Pravatar) DB avatars so the UI falls back to **Gravatar** by email.
 * Targets: seed reviewers + any user with reviews whose image is still on those hosts.
 *
 * Run: npx tsx scripts/fix-reviewer-avatars.ts
 */
import { loadEnvConfig } from "@next/env";
import { prisma } from "../lib/prisma-script";

loadEnvConfig(process.cwd());

const SEED_EMAIL_HOST = "reviews.seed.humpbuck";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: `@${SEED_EMAIL_HOST}` } },
        {
          OR: [
            { image: { startsWith: "https://images.unsplash.com" } },
            { image: { startsWith: "https://api.dicebear.com" } },
            { image: { startsWith: "https://i.pravatar.cc" } },
          ],
          productReviews: { some: {} },
        },
      ],
    },
    select: { id: true, email: true },
  });

  let n = 0;
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { image: null },
    });
    n++;
  }

  console.log(
    `Cleared ${n} reviewer profile image(s); Gravatar (by email) will show in UI.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
