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
 * **Legacy** folder segment: slug characters only. Still used to validate old image URLs
 * (objects uploaded before title-based paths).
 */
export function safeReviewProductFolderSegment(productSlug: string): string {
  const s = productSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return s || "product";
}

/**
 * R2: `reviews/{title-slug}__{product-slug}/` — readable product title, plus `__` + URL slug
 * for uniqueness and stable keys when the display name changes. Title is from `getProductBySlug().name`.
 */
export function slugifyProductTitleForR2Folder(name: string): string {
  const n = name.normalize("NFKC").trim();
  const cleaned = n
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[/\\?#]+/g, " ");
  const slug = cleaned
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const max = 80;
  return (slug.length > max ? slug.slice(0, max).replace(/-+$/g, "") : slug) || "product";
}

export function getReviewR2ProductFolderName(productSlug: string): string {
  return safeReviewProductFolderSegment(productSlug);
}

export function reviewImageObjectKey(
  productSlug: string,
  userId: string,
): string {
  const folder = getReviewR2ProductFolderName(productSlug);
  const rid = randomBytes(8).toString("hex");
  return `reviews/${folder}/${userId}/${Date.now()}-${rid}.webp`;
}

/** Follow-up (追加) images — `reviews/{folder}/append/...` (same public prefix rules as main review). */
export function reviewAppendImageObjectKey(
  productSlug: string,
  userId: string,
): string {
  const folder = getReviewR2ProductFolderName(productSlug);
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
  const p = urlPathname(u);
  for (const folder of localReviewPathFoldersForProduct(productSlug)) {
    if (p.startsWith(`/review-uploads/${folder}/`)) return true;
  }
  return false;
}

function r2PathPrefixesForProduct(productSlug: string): string[] {
  const base = publicBaseUrlForReviewAssets();
  return [
    `${base}/reviews/${getReviewR2ProductFolderName(productSlug)}/`,
    // Legacy: slug-only folder (and optional duplicate sanitize)
    `${base}/reviews/${safeReviewProductFolderSegment(productSlug)}/`,
  ];
}

function localReviewPathFoldersForProduct(productSlug: string): string[] {
  return [
    getReviewR2ProductFolderName(productSlug),
    safeReviewProductFolderSegment(productSlug),
  ];
}

export function assertReviewImageUrlsBelongToProduct(
  productSlug: string,
  urls: string[],
  maxImages: number,
): void {
  if (urls.length > maxImages) {
    throw new Error(`At most ${maxImages} images`);
  }
  const r2Ok = (u: string) =>
    r2PathPrefixesForProduct(productSlug).some((p) => u.startsWith(p));
  for (const u of urls) {
    if (isLocalDevReviewPathForProduct(u, productSlug)) continue;
    if (!r2Ok(u)) {
      throw new Error("Invalid image URL for this product");
    }
  }
}
