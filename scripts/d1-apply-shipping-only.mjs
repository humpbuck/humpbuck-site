/**
 * Shipping fee tables are part of the squashed baseline migration
 * (`prisma/migrations/20260725190000_init_sqlite`). Prefer:
 *
 *   npm run db:d1:local
 *   npm run db:d1:remote
 *   node scripts/d1-apply-migration.mjs --full-init   # fresh D1 only
 *
 * This script remains as a no-op alias so older docs / muscle memory still work.
 */
console.log(
  "Shipping schema is included in the baseline migration (20260725190000_init_sqlite).",
);
console.log("Nothing to apply. Use npm run db:d1:local or db:d1:remote if needed.");
