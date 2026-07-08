/// <reference types="@cloudflare/workers-types" />

/* Cloudflare Worker bindings — run `npm run cf-typegen` after editing wrangler.jsonc. */
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
  IMAGES: ImagesBinding;
}
