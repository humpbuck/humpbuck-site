import { randomBytes } from "crypto";
import { presignR2Put, putR2Object } from "@/lib/r2-aws4";
import { R2_PUBLIC_BASE } from "@/lib/r2";

const INQUIRY_ID_RE = /^[a-f0-9]{32}$/;

export function isR2OemInquiryUploadConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

export function normalizeOemInquiryId(raw: string): string | null {
  const id = raw.trim().toLowerCase();
  return INQUIRY_ID_RE.test(id) ? id : null;
}

export function oemInquiryLogoObjectKey(inquiryId: string): string {
  const rid = randomBytes(6).toString("hex");
  return `oem-inquiries/${inquiryId}/logo-${Date.now()}-${rid}`;
}

export function oemInquiryLogoObjectKeyWithExt(
  inquiryId: string,
  contentType: string,
): string {
  const ext = contentType === "image/png" ? "png" : "jpg";
  return `${oemInquiryLogoObjectKey(inquiryId)}.${ext}`;
}

export async function presignOemInquiryLogoPut(
  key: string,
  contentType: string,
): Promise<string> {
  return presignR2Put(key, contentType, 60 * 5);
}

export async function uploadOemInquiryLogoToR2(
  inquiryId: string,
  contentType: string,
  body: Uint8Array | ArrayBuffer,
): Promise<{ key: string; publicUrl: string }> {
  const key = oemInquiryLogoObjectKeyWithExt(inquiryId, contentType);
  await putR2Object(key, contentType, body);
  return { key, publicUrl: publicUrlForOemInquiryKey(key) };
}

export function publicBaseUrlForOemInquiryAssets(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

export function publicUrlForOemInquiryKey(key: string): string {
  return `${publicBaseUrlForOemInquiryAssets()}/${key}`;
}

export function isValidOemInquiryLogoKey(key: string, inquiryId: string): boolean {
  const normalized = key.trim();
  if (!normalized.startsWith(`oem-inquiries/${inquiryId}/`)) return false;
  return /\.(png|jpe?g)$/i.test(normalized);
}

export function isOemInquiryLogoPublicUrl(url: string, inquiryId: string): boolean {
  try {
    const base = publicBaseUrlForOemInquiryAssets();
    const parsed = new URL(url.trim());
    const baseParsed = new URL(base);
    if (parsed.origin !== baseParsed.origin) return false;
    const key = parsed.pathname.replace(/^\//, "");
    return isValidOemInquiryLogoKey(key, inquiryId);
  } catch {
    return false;
  }
}
