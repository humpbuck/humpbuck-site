import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2_GALLERY_SPECS_BY_SLUG, R2_PUBLIC_BASE } from "@/lib/r2";

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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function styleNumberFromVariantId(variantId?: string): number | null {
  if (!variantId?.trim()) return null;
  const m = /^style-(\d+)$/i.exec(variantId.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function buildProductMediaObjectKey(params: {
  productSlug: string;
  section: ProductMediaSection;
  contentType: string;
  variantId?: string;
  sortIndex?: number;
}): string {
  const slug = normalizeSlug(params.productSlug);
  const section = params.section;
  const ext = params.contentType === "video/mp4" ? "mp4" : "webp";
  const spec = R2_GALLERY_SPECS_BY_SLUG[slug];

  if (!spec) {
    if (section === "video") return `products/${slug}/video/${slug}-video.${ext}`;
    const n = Math.max(1, Math.floor(params.sortIndex ?? 1));
    const mid = section === "variants" ? "style" : section;
    return `products/${slug}/${section}/${slug}-${mid}-${pad2(n)}.${ext}`;
  }

  if (section === "video") {
    return `products/${spec.slugFolder}/video/${spec.filePrefix}-video.${ext}`;
  }
  if (section === "variants") {
    const n =
      styleNumberFromVariantId(params.variantId) ??
      Math.max(1, Math.floor(params.sortIndex ?? 1));
    const variantPrefix = spec.variantFilePrefix ?? spec.filePrefix;
    const variantMid = spec.variantSlug ?? "style";
    return `products/${spec.slugFolder}/variants/${variantPrefix}-${variantMid}-${pad2(n)}.${ext}`;
  }
  const n = Math.max(1, Math.floor(params.sortIndex ?? 1));
  return `products/${spec.slugFolder}/${section}/${spec.filePrefix}-${section}-${pad2(n)}.${ext}`;
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
