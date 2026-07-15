import { NextResponse } from "next/server";
import { checkFormRateLimit, formRateLimitKey } from "@/lib/form-rate-limit";
import {
  isR2OemInquiryUploadConfigured,
  normalizeOemInquiryEmailFolder,
  oemInquiryLogoObjectKeyWithExt,
  presignOemInquiryLogoPut,
  publicUrlForOemInquiryKey,
} from "@/lib/r2-oem-inquiry-upload";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 20;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const rateLimit = checkFormRateLimit(
    formRateLimitKey(forwardedFor, "oem-inquiry-presign"),
    RATE_MAX_REQUESTS,
    RATE_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  if (!isR2OemInquiryUploadConfigured()) {
    return NextResponse.json(
      { error: "Logo upload is not configured. Please contact support@humpbuck.com." },
      { status: 503 },
    );
  }

  let body: { email?: string; contentType?: string; byteSize?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const emailFolder = normalizeOemInquiryEmailFolder(String(body.email ?? ""));
  const contentType = String(body.contentType ?? "").trim();
  const byteSize = Number(body.byteSize);

  if (!emailFolder) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Only JPG and PNG images are allowed." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(byteSize) || byteSize < 1 || byteSize > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image must be between 1 byte and ${MAX_BYTES} bytes.` },
      { status: 400 },
    );
  }

  const key = oemInquiryLogoObjectKeyWithExt(emailFolder, contentType);
  const uploadUrl = await presignOemInquiryLogoPut(key, contentType);
  const publicUrl = publicUrlForOemInquiryKey(key);
  return NextResponse.json({ uploadUrl, publicUrl, key });
}
