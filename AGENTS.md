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
- **Review photo uploads to R2** (buyer flow / presign): object keys are `reviews/{folder}/{userId}/…webp` where `folder` = `slugify(catalog product name) + "__" + product slug` from `getReviewR2ProductFolderName` in `lib/r2-review-upload.ts` (human-readable title segment + unique slug). **Legacy** uploads may still live under `reviews/{slug-only}/…`; the server accepts both when validating URLs.
- **Avatars — header:** `getBuyerAvatarDisplayUrl`: custom `User.image` (R2, including 30 **built-in** presets under `Avatar/avatars-default/` on the public R2 host) wins; else **Gravatar** (identicon fallback). **PDP reviews:** `getReviewAvatarDisplayUrl` — `User.image` else **i.pravatar.cc** (deterministic by email, like legacy DB URLs). If no URL or image `onError`, **initial letter**. See `lib/avatar-resolve.ts` + `lib/avatar-presets.ts`. `npm run db:fix-review-avatars` clears old Unsplash/Pravatar URLs in DB; reviews still get portraits without DB rows.

## Storefront images (R2)

- Customer-facing photos from R2: use **`StorefrontImage`** (`components/site/storefront-image.tsx`), not raw `next/image` with manual `unoptimized`. R2 URLs load directly from the CDN (`lib/r2-public-image.ts`). Avatars keep `HeaderUserAvatar` / `ReviewerAvatar`.

## Storefront locale `ar` (Arabic)

- Locale code **`ar`** in `i18n/routing.ts`; RTL with Hebrew (`dir` on `<html>`). Messages: `messages/ar.json`, `messages/policies.ar.json`, `messages/storefront-extra.ar.json`, `messages/product-copy.ar.json`. Rebuild: `node scripts/build-ar-locale.mjs` after editing `scripts/ar-batch*.json` or `scripts/ar-quality-fixes.json` (apply via `node scripts/apply-ar-quality-fixes.mjs`).

## Git push to GitHub

Read **`docs/user-conventions.md` §5** before any sync.

**Workspace = sync target:** Only push the repo whose folder is open in Cursor. In **this** workspace (`humpbuck-site`), never push sadhakashop; open `sadhakashop-site` for that.

**humpbuck-site (this repo):**

- **Remote:** `git@github.com-humpbuck:ouhao2016-creator/humpbuck-site.git` — never plain `git@github.com:`.
- **SSH key:** `~/.ssh/id_ed25519` via Host `github.com-humpbuck` in `~/.ssh/config`. **Not** `id_ed25519_humpbuck`.
- **GitHub fingerprint (source of truth):** `SHA256:0v8+sG9YkiVKYgS0/gX/8sJDoMg3ZEgxodBjTHRAHnw` on key title `humpbuck`.
- **When user asks to sync here:** confirm `git remote -v` → `github.com-humpbuck`; `ssh -T git@github.com-humpbuck` → `Hi ouhao2016-creator!`; then `git push origin main`. Commit only when explicitly requested.

**sadhakashop-site:** separate workspace — see that repo’s `docs/user-conventions.md` §5 (`github.com-sadhakashop` + `id_ed25519_sadhakashop`).
