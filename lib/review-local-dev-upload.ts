import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  getReviewR2ProductFolderName,
  isR2ReviewUploadConfigured,
} from "@/lib/r2-review-upload";

const TTL_MS = 5 * 60_000;
const pending = new Map<string, { userId: string; relativePath: string; exp: number }>();

/**
 * R2 is missing (typical in local .env) — write review images to `public/review-uploads/...`
 * so the flow works without Cloudflare. Disabled on Vercel (ephemeral / read-only FS for writes).
 * Set `ALLOW_REVIEW_IMAGE_LOCAL=1` to enable with `next start` (e.g. private server).
 */
export function isLocalReviewImageUploadEnabled(): boolean {
  if (isR2ReviewUploadConfigured()) return false;
  if (process.env.VERCEL) return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_REVIEW_IMAGE_LOCAL === "1"
  );
}

function pruneExpired() {
  const now = Date.now();
  for (const [k, v] of pending) {
    if (v.exp < now) pending.delete(k);
  }
}

function newRelativePath(productSlug: string, userId: string): string {
  const folder = getReviewR2ProductFolderName(productSlug);
  const rid = randomBytes(8).toString("hex");
  return `review-uploads/${folder}/${userId}/${Date.now()}-${rid}.webp`;
}

function newAppendRelativePath(productSlug: string, userId: string): string {
  const folder = getReviewR2ProductFolderName(productSlug);
  const rid = randomBytes(8).toString("hex");
  return `review-uploads/${folder}/append/${userId}/${Date.now()}-${rid}.webp`;
}

export function createLocalReviewUploadSlot(
  userId: string,
  productSlug: string,
): { token: string; publicPath: string } {
  pruneExpired();
  const relativePath = newRelativePath(productSlug, userId);
  const token = randomBytes(32).toString("hex");
  pending.set(token, { userId, relativePath, exp: Date.now() + TTL_MS });
  return { token, publicPath: `/${relativePath}` };
}

export function createLocalReviewAppendUploadSlot(
  userId: string,
  productSlug: string,
): { token: string; publicPath: string } {
  pruneExpired();
  const relativePath = newAppendRelativePath(productSlug, userId);
  const token = randomBytes(32).toString("hex");
  pending.set(token, { userId, relativePath, exp: Date.now() + TTL_MS });
  return { token, publicPath: `/${relativePath}` };
}

export async function saveLocalReviewImageFromToken(
  token: string,
  userId: string,
  bytes: Buffer,
  maxBytes: number,
): Promise<string> {
  pruneExpired();
  if (bytes.length < 1 || bytes.length > maxBytes) {
    throw new Error("Invalid image size");
  }
  const r = pending.get(token);
  if (!r || r.userId !== userId || r.exp < Date.now()) {
    throw new Error("Invalid or expired upload token");
  }
  pending.delete(token);
  const abs = join(process.cwd(), "public", ...r.relativePath.split("/"));
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
  return `/${r.relativePath}`;
}
