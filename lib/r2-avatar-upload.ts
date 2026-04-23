import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";
import { R2_PUBLIC_BASE } from "@/lib/r2";
import { isR2ReviewUploadConfigured } from "@/lib/r2-review-upload";

export function isR2AvatarUploadConfigured(): boolean {
  return isR2ReviewUploadConfigured();
}

function r2S3(): S3Client {
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

export function r2PublicAssetBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

function publicBaseUrl(): string {
  return r2PublicAssetBaseUrl();
}

/** Matches your R2 console folder `Avatar/`. */
export function avatarObjectKey(userId: string): string {
  const rid = randomBytes(8).toString("hex");
  return `Avatar/${userId}/${Date.now()}-${rid}.webp`;
}

export async function presignAvatarPut(
  key: string,
  contentType: string,
): Promise<string> {
  const client = r2S3();
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!.trim(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: 60 * 5 });
}

export function publicUrlForAvatarKey(key: string): string {
  return `${publicBaseUrl()}/${key}`;
}

export function assertAvatarUrlForUser(userId: string, url: string): void {
  const base = publicBaseUrl();
  const prefix = `${base}/Avatar/${userId}/`;
  if (!url.startsWith(prefix)) {
    throw new Error("Avatar URL must be your uploaded file on this store.");
  }
}
