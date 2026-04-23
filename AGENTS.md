<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Humpbuck — persistent notes (read each session)

**Cursor does not keep chat history across new conversations.** The evolving **user requirements and agreed rules** for this site are recorded in [`docs/user-conventions.md`](docs/user-conventions.md) (and updated after important sessions). Read that file in addition to this section. This `AGENTS.md` block is a short technical handoff for local ops.

**Stability / change policy:** The repo includes [`.cursor/rules/humpbuck-stability.mdc`](.cursor/rules/humpbuck-stability.mdc) (`alwaysApply: true`). Do **not** change the app unless the user’s current request clearly asks for it; no drive-by refactors; minimal diffs; `docs/user-conventions.md` is the written source of what the site “should be.”

## Product reviews (PDP “Buyer reviews”)

- **Source of truth is the database**, not R2. The UI uses `getProductReviewsWithUsers` → Prisma `ProductReview` (see `lib/product-reviews-queries.ts`). A folder on R2 alone does **not** create visible reviews; you need rows in SQLite (or your deployed DB).
- **Seed demo data (5–8 reviews per catalog product, text only, no R2 files required):** `npm run db:seed-reviews` (runs `prisma/seed-reviews.ts`). Run after `npm run db:migrate` on a new machine or new DB. Safe to re-run: it deletes only seed users with email `@reviews.seed.humpbuck` and recreates their reviews.
- **Review photo uploads to R2** (buyer flow / presign): object keys are `reviews/{folder}/{userId}/…webp` where `folder` is the **URL product slug** (e.g. `digitemp-2301`, `rm-m10`), from `safeReviewProductFolderSegment` in `lib/r2-review-upload.ts` — same as the `slug` in `lib/catalog.ts`, **not** the long marketing product title. If your bucket used title-based names, they won’t match the app’s presign path until keys align with slug folders.
- **Avatars (header + reviews):** custom `User.image` (R2 or 30 **Open Peeps**-style presets via DiceBear `open-peeps`, white background; see [openpeeps.com](https://www.openpeeps.com/)) wins; else **Gravatar** from email when enabled. If Gravatar is off, missing email, or the image fails to load, the UI shows the user’s **initial letter**. See `lib/avatar-resolve.ts` + `lib/avatar-presets.ts`. Seed reviewers use `image: null`. `npm run db:fix-review-avatars` clears legacy Unsplash/DiceBear/Pravatar image URLs in the DB.
