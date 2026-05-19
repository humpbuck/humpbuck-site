import { NextResponse } from "next/server";
import { ADMIN_INBOX_CATEGORY, createAdminInboxMessage } from "@/lib/admin-inbox";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { checkFormRateLimit, formRateLimitKey } from "@/lib/form-rate-limit";
import { publicSupportEmail } from "@/lib/support-contact";
import { verifyTurnstileToken } from "@/lib/turnstile-verify";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

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

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = text(body.email).toLowerCase();
  const subject = text(body.subject).slice(0, MAX_SUBJECT);
  const message = text(body.message).slice(0, MAX_MESSAGE);
  const pageUrl = text(body.pageUrl).slice(0, 500);
  const locale = text(body.locale).slice(0, 16);
  const website = text(body.website);
  const turnstileToken = text(body.turnstileToken);

  if (website) {
    return NextResponse.json({ error: "Request rejected." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Please enter your message." }, { status: 400 });
  }
  if (!turnstileToken) {
    return NextResponse.json({ error: "Verification is required." }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const rateLimit = checkFormRateLimit(
    formRateLimitKey(forwardedFor, email),
    RATE_MAX_REQUESTS,
    RATE_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const verified = await verifyTurnstileToken(turnstileToken, forwardedFor);
  if (!verified) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 400 },
    );
  }

  const supportTo =
    process.env.MERCHANT_NOTIFY_EMAIL?.trim() || publicSupportEmail();
  const nowIso = new Date().toISOString();
  const mailSubject =
    subject || `Storefront contact from ${email}`;

  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.contactSupport,
    sourceEmail: email,
    payload: {
      email,
      subject: subject || null,
      message,
      pageUrl: pageUrl || null,
      locale: locale || null,
      createdAt: nowIso,
    },
  });

  const mail = await sendTransactionalEmail({
    to: supportTo,
    replyTo: { email, name: email.split("@")[0] || email },
    subject: mailSubject,
    htmlContent: `
      <p>Hello,</p>
      <p>A new message was submitted from the storefront contact form.</p>
      <ul>
        <li><strong>From:</strong> ${escapeHtml(email)}</li>
        <li><strong>Subject:</strong> ${escapeHtml(subject || "(none)")}</li>
        ${pageUrl ? `<li><strong>Page:</strong> <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></li>` : ""}
        ${locale ? `<li><strong>Locale:</strong> ${escapeHtml(locale)}</li>` : ""}
        <li><strong>Submitted at:</strong> ${escapeHtml(nowIso)}</li>
      </ul>
      <p><strong>Message</strong></p>
      <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
      <p style="margin-top:16px;font-size:12px;color:#6b6560;">Reply in your mail client to reach the customer directly.</p>
    `,
    textContent:
      `Storefront contact form\n` +
      `From: ${email}\n` +
      `Subject: ${subject || "(none)"}\n` +
      (pageUrl ? `Page: ${pageUrl}\n` : "") +
      (locale ? `Locale: ${locale}\n` : "") +
      `Submitted at: ${nowIso}\n\n` +
      `Message:\n${message}`,
  });

  if (!mail.ok) {
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
