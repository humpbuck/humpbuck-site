import { presignR2Put } from "@/lib/r2-aws4";
import { R2_PUBLIC_BASE } from "@/lib/r2";

/** R2 object key for the founder story image (homepage + About page). */
export const ABOUT_FOUNDER_R2_KEY = "Home/about-founder.webp";

export function isR2AboutUploadConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

export async function presignAboutFounderImagePut(
  contentType: string,
): Promise<string> {
  return presignR2Put(ABOUT_FOUNDER_R2_KEY, contentType, 60 * 5);
}

function publicBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

export function publicUrlForAboutFounderImageKey(): string {
  return `${publicBase()}/${ABOUT_FOUNDER_R2_KEY}`;
}
