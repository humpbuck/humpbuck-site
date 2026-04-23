/**
 * Synthetic 5–8 (random) five-star buyer reviews per catalog product for PDP demos. `User.image` is
 * null so the UI uses **Gravatar** per seed email; text only — `imageUrlsJson` is empty. Reviews come
 * from this Prisma data only — the
 * `reviews/` folder on R2 is for *uploaded* review photos, not a directory listing for the app.
 * R2 upload paths: see `lib/r2-review-upload.ts` (`getReviewR2ProductFolderName` for new uploads; legacy slug-only folders still valid in the bucket).
 *
 * Safe to re-run: deletes prior seed users with `@reviews.seed.humpbuck` and their reviews.
 * **Real** buyer reviews (any other user email) are **not** deleted.
 * Run: `npm run db:seed-reviews` (or `npx tsx prisma/seed-reviews.ts` with env loaded).
 *
 * **Why `www` shows "No reviews" but `localhost` has them?**
 * The storefront reads the **Postgres** bound to `DATABASE_URL`. Vercel Production must use the same
 * database you seed. If you only ever ran this script on your laptop, the **Neon** DB behind production
 * has no (or not enough) `ProductReview` rows for that `productSlug`.
 *
 * **Fill production (run from a private machine, do not commit secrets):**
 * 1. Vercel → Project → Settings → Environment Variables → copy **Production** `DATABASE_URL`.
 * 2. PowerShell: `$env:DATABASE_URL = "paste-neon-string"` then `npm run db:seed-reviews`
 * 3. If the pooler times out, use Neon's **direct** (non-`-pooler`) connection for this one-off command.
 * 4. Redeploy or open the product PDP; reviews are from DB, not R2.
 */
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { getAllProducts } from "../lib/catalog";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const SEED_EMAIL_HOST = "reviews.seed.humpbuck";

const DISPLAY_NAMES = [
  "Jordan K.",
  "Sam T.",
  "Riley M.",
  "Casey L.",
  "Morgan P.",
  "Alex R.",
  "Taylor B.",
  "Jamie C.",
  "Drew W.",
  "Quinn H.",
  "Reese N.",
  "Avery S.",
  "Cameron J.",
  "Logan F.",
  "Skyler D.",
  "Rowan V.",
  "Emerson G.",
  "Hayden O.",
  "Parker Y.",
  "Sydney A.",
  "Blake E.",
  "Charlie U.",
  "Finley I.",
  "River Z.",
  "Shawn X.",
  "Jess Q.",
  "Chris V.",
  "Pat N.",
  "Lee W.",
  "Kim H.",
];

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function reviewBodies(): string[] {
  return [
    "Exactly what I expected — feels solid on the wrist.",
    "Shipped fast and packed well. No complaints at all.",
    "Looks even better in person. Very happy with it.",
    "Comfortable for all-day wear; clasp is smooth.",
    "Great value for the finishing you get.",
    "My second purchase from here — consistent quality.",
    "Wife noticed it right away. Subtle but sharp.",
    "Keeps time fine; wears lighter than it looks.",
    "Arrived a day early. Box was tidy and protective.",
    "Photos don’t do the dial justice — really clean.",
    "Matches the listing perfectly. Five stars.",
    "Been wearing it daily for two weeks — still impressed.",
    "Simple to size; feels premium for the price.",
    "Customer service answered a sizing question quickly.",
    "Exactly the style I was hunting for.",
    "No scratches out of the box; QC looks tight.",
    "Gets compliments at work without being loud.",
    "Strap broke in nicely after a couple of days.",
    "Would buy again — recommended to a friend already.",
    "Build feels tight; nothing rattles or squeaks.",
    "Clean lines, easy to read at a glance.",
    "Better than a mall brand I returned last month.",
    "Tracking was accurate; signature on delivery.",
    "It’s become my go-to for weekends.",
    "Small details (hands, indices) are crisp up close.",
    "Honestly exceeded my expectations a little.",
    "Pairs well with both casual and dress shirts.",
    "Battery / movement — whatever’s inside — been flawless so far.",
    "If you’re on the fence, I’d pull the trigger.",
    "Short review: love it. Would order again.",
  ];
}

function randomPastDate(withinDays: number): Date {
  const ms = Math.random() * withinDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

async function main() {
  const deleted = await prisma.user.deleteMany({
    where: { email: { endsWith: `@${SEED_EMAIL_HOST}` } },
  });
  console.log(`Removed ${deleted.count} prior seed reviewer account(s) (reviews cascade).`);

  const catalog = getAllProducts();
  let reviews = 0;

  for (const product of catalog) {
    const n = randInt(5, 8);
    const pool = reviewBodies();

    for (let i = 0; i < n; i++) {
      const name = pick(DISPLAY_NAMES);
      let body = pick(pool);
      if (Math.random() < 0.35) {
        const extra = pick(pool.filter((x) => x !== body));
        body = `${body} ${extra}`;
      }

      const email = `${randomUUID().replace(/-/g, "")}@${SEED_EMAIL_HOST}`;

      const user = await prisma.user.create({
        data: {
          name,
          email,
          /* `User.image` empty → UI uses Gravatar from email (same as real buyers). */
          image: null,
        },
      });

      await prisma.productReview.create({
        data: {
          userId: user.id,
          orderId: randomUUID(),
          productSlug: product.slug,
          rating: 5,
          body,
          imageUrlsJson: "[]",
          createdAt: randomPastDate(120),
        },
      });
      reviews++;
    }
    console.log(`  ${product.slug}: ${n} reviews`);
  }

  console.log(`Done. ${reviews} five-star reviews across ${catalog.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
