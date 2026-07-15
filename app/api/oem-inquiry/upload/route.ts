import { NextResponse } from "next/server";
import { checkFormRateLimit, formRateLimitKey } from "@/lib/form-rate-limit";
import {
  isR2OemInquiryUploadConfigured,
  normalizeOemInquiryEmailFolder,
  uploadOemInquiryLogoToR2,
} from "@/lib/r2-oem-inquiry-upload";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 20;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const rateLimit = checkFormRateLimit(
    formRateLimitKey(forwardedFor, "oem-inquiry-upload"),
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const emailFolder = normalizeOemInquiryEmailFolder(String(form.get("email") ?? ""));
  const website = String(form.get("website") ?? "").trim();
  const file = form.get("file");

  if (website) {
    return NextResponse.json({ error: "Request rejected." }, { status: 400 });
  }
  if (!emailFolder) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please upload your logo (JPG or PNG)." }, { status: 400 });
  }

  const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Only JPG and PNG images are allowed." },
      { status: 400 },
    );
  }
  if (file.size < 1 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image must be between 1 byte and ${MAX_BYTES} bytes.` },
      { status: 400 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { key, publicUrl } = await uploadOemInquiryLogoToR2(
      emailFolder,
      contentType,
      bytes,
    );
    return NextResponse.json({ publicUrl, key });
  } catch {
    return NextResponse.json(
      { error: "Logo upload failed. Please try again." },
      { status: 502 },
    );
  }
}
