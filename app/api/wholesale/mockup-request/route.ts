import { NextResponse } from "next/server";
import { ADMIN_INBOX_CATEGORY, createAdminInboxMessage } from "@/lib/admin-inbox";
import { sendTransactionalEmail } from "@/lib/brevo-mail";

type Bucket = { count: number; resetAt: number };

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const rateLimitBuckets = new Map<string, Bucket>();

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRateLimitKey(ip: string | null, email: string) {
  return `${ip || "unknown"}:${email || "unknown"}`;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true as const, remaining: RATE_MAX_REQUESTS - 1, resetAt: now + RATE_WINDOW_MS };
  }

  if (bucket.count >= RATE_MAX_REQUESTS) {
    return { allowed: false as const, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  return { allowed: true as const, remaining: RATE_MAX_REQUESTS - bucket.count, resetAt: bucket.resetAt };
}

async function verifyTurnstile(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return false;

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  if (ip) formData.set("remoteip", ip);

  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!result.ok) return false;
  const data = (await result.json().catch(() => null)) as null | { success?: boolean };
  return Boolean(data?.success);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const company = text(body.company);
  const targetRegion = text(body.targetRegion);
  const estimatedQty = text(body.estimatedQty);
  const notes = text(body.notes);
  const email = text(body.email).toLowerCase();
  const website = text(body.website);
  const turnstileToken = text(body.turnstileToken);

  if (website) {
    return NextResponse.json({ error: "Request rejected." }, { status: 400 });
  }
  if (!company) {
    return NextResponse.json({ error: "Company / project name is required." }, { status: 400 });
  }
  if (!notes) {
    return NextResponse.json({ error: "Please add brief notes for your request." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!turnstileToken) {
    return NextResponse.json({ error: "Verification is required." }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const rateLimit = checkRateLimit(getRateLimitKey(forwardedFor, email));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const verified = await verifyTurnstile(turnstileToken, forwardedFor);
  if (!verified) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const rateLimitKey = getRateLimitKey(forwardedFor, email);
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
  }

  const notifyTo = process.env.MERCHANT_NOTIFY_EMAIL?.trim() || "humpbuck@outlook.com";
  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.emailMockupRequest,
    sourceEmail: email,
    payload: {
      company,
      targetRegion,
      estimatedQty,
      notes,
      email,
      createdAt: nowIso,
    },
  });

  const mail = await sendTransactionalEmail({
    to: notifyTo,
    subject: "New Email mockup request",
    htmlContent: `
      <p>Hello,</p>
      <p>A new EMAIL MOCKUP REQUEST was submitted.</p>
      <ul>
        <li><strong>Company / project name:</strong> ${escapeHtml(company)}</li>
        <li><strong>Target region:</strong> ${escapeHtml(targetRegion || "-")}</li>
        <li><strong>Estimated qty:</strong> ${escapeHtml(estimatedQty || "-")}</li>
        <li><strong>Email:</strong> ${escapeHtml(email)}</li>
        <li><strong>Submitted at:</strong> ${escapeHtml(nowIso)}</li>
      </ul>
      <p><strong>Notes</strong></p>
      <p>${escapeHtml(notes).replaceAll("\n", "<br/>")}</p>
    `,
    textContent:
      `New EMAIL MOCKUP REQUEST\n` +
      `Company / project name: ${company}\n` +
      `Target region: ${targetRegion || "-"}\n` +
      `Estimated qty: ${estimatedQty || "-"}\n` +
      `Email: ${email}\n` +
      `Submitted at: ${nowIso}\n\n` +
      `Notes:\n${notes}`,
  });

  if (!mail.ok) {
    return NextResponse.json({ error: "Failed to send notification email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
