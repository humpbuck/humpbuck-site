import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";
import { R2_PUBLIC_BASE } from "@/lib/r2";

export function isR2ReviewUploadConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim(),
  );
}

function reviewsS3(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

/**
 * R2 object prefix `reviews/{productSlug}/` — **slug matches catalog / product URL**
 * (e.g. `rm-m10`), so folders map 1:1 to product titles in your admin/catalog.
 */
export function safeReviewProductFolderSegment(productSlug: string): string {
  const s = productSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return s || "product";
}

export function reviewImageObjectKey(
  productSlug: string,
  userId: string,
): string {
  const folder = safeReviewProductFolderSegment(productSlug);
  const rid = randomBytes(8).toString("hex");
  return `reviews/${folder}/${userId}/${Date.now()}-${rid}.webp`;
}

/** Follow-up (追加) images — `reviews/{folder}/append/...` (same public prefix rules as main review). */
export function reviewAppendImageObjectKey(
  productSlug: string,
  userId: string,
): string {
  const folder = safeReviewProductFolderSegment(productSlug);
  const rid = randomBytes(8).toString("hex");
  return `reviews/${folder}/append/${userId}/${Date.now()}-${rid}.webp`;
}

export async function presignReviewImagePut(
  key: string,
  contentType: string,
): Promise<string> {
  const client = reviewsS3();
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!.trim(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: 60 * 5 });
}

export function publicBaseUrlForReviewAssets(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

export function publicUrlForReviewKey(key: string): string {
  return `${publicBaseUrlForReviewAssets()}/${key}`;
}

function urlPathname(u: string): string {
  const t = u.trim();
  if (!t) return "";
  if (t.startsWith("/")) return t.split("?")[0] ?? t;
  try {
    return new URL(t).pathname;
  } catch {
    return "";
  }
}

/** Dev/local: `public/review-uploads/{folder}/…` (see `lib/review-local-dev-upload.ts`). */
function isLocalDevReviewPathForProduct(u: string, productSlug: string): boolean {
  const folder = safeReviewProductFolderSegment(productSlug);
  const p = urlPathname(u);
  return p.startsWith(`/review-uploads/${folder}/`);
}

export function assertReviewImageUrlsBelongToProduct(
  productSlug: string,
  urls: string[],
  maxImages: number,
): void {
  if (urls.length > maxImages) {
    throw new Error(`At most ${maxImages} images`);
  }
  const folder = safeReviewProductFolderSegment(productSlug);
  const prefix = `${publicBaseUrlForReviewAssets()}/reviews/${folder}/`;
  for (const u of urls) {
    if (isLocalDevReviewPathForProduct(u, productSlug)) continue;
    if (!u.startsWith(prefix)) {
      throw new Error("Invalid image URL for this product");
    }
  }
}
