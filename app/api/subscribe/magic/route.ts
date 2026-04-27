import { NextResponse } from "next/server";
import { addEmailToBrevoNewsletter } from "@/lib/brevo-subscribe-contact";
import { recordMarketingOptInFromSubscribe } from "@/lib/email-marketing-preference";
import { sendSubscribeSuccessEmail } from "@/lib/subscribe-success-email";
import { parseSubscribeMagicRequest } from "@/lib/subscribe-magic-link";

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/**
 * One-click newsletter opt-in from shipment / marketing emails (signed link).
 * GET /api/subscribe/magic?e=…&exp=…&s=…
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = parseSubscribeMagicRequest(url.searchParams);
  const origin = appOrigin();

  if (!parsed) {
    return NextResponse.redirect(
      new URL("/newsletter/confirmed?r=invalid", origin),
    );
  }

  const result = await addEmailToBrevoNewsletter(parsed.email);
  if (!result.ok) {
    const q = new URLSearchParams({ r: "error" });
    if (result.error.includes("not configured")) q.set("r", "not_configured");
    return NextResponse.redirect(new URL(`/newsletter/confirmed?${q}`, origin));
  }

  try {
    await recordMarketingOptInFromSubscribe(parsed.email);
  } catch {
    /* local DB best-effort */
  }
  await sendSubscribeSuccessEmail(parsed.email).catch(() => null);

  const q = new URLSearchParams({ r: "ok" });
  if (result.already) q.set("r", "already");
  return NextResponse.redirect(new URL(`/newsletter/confirmed?${q}`, origin));
}
