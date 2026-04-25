import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";
import { R2_PUBLIC_BASE } from "@/lib/r2";

export function isR2ProductUploadConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim(),
  );
}

function r2Client(): S3Client {
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

function normalizeSlug(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "product"
  );
}

export type ProductMediaSection = "gallery" | "detail" | "variants" | "video";

export function buildProductMediaObjectKey(params: {
  productSlug: string;
  section: ProductMediaSection;
  contentType: string;
  variantId?: string;
}): string {
  const slug = normalizeSlug(params.productSlug);
  const section = params.section;
  const ext = params.contentType === "video/mp4" ? "mp4" : "webp";
  const rid = randomBytes(8).toString("hex");
  const ts = Date.now();
  if (section === "variants") {
    const variant = normalizeSlug(params.variantId || "style-01");
    return `products/${slug}/variants/${variant}/${ts}-${rid}.${ext}`;
  }
  return `products/${slug}/${section}/${ts}-${rid}.${ext}`;
}

export async function presignProductMediaPut(
  key: string,
  contentType: string,
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!.trim(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), cmd, { expiresIn: 60 * 5 });
}

function publicBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

export function publicUrlForProductMediaKey(key: string): string {
  return `${publicBase()}/${key}`;
}
