import { randomBytes } from "crypto";
import { presignR2Put } from "@/lib/r2-aws4";
import { R2_PUBLIC_BASE } from "@/lib/r2";
import { isR2ReviewUploadConfigured } from "@/lib/r2-review-upload";

export function isR2AvatarUploadConfigured(): boolean {
  return isR2ReviewUploadConfigured();
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
  return presignR2Put(key, contentType, 60 * 5);
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
