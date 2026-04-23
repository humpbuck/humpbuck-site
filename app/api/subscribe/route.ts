import { NextResponse } from "next/server";
import { addEmailToBrevoNewsletter } from "@/lib/brevo-subscribe-contact";
import { recordMarketingOptInFromSubscribe } from "@/lib/email-marketing-preference";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const result = await addEmailToBrevoNewsletter(email);
  if (!result.ok) {
    const status =
      result.error.includes("not configured") ||
      result.error.includes("Invalid newsletter")
        ? 503
        : 502;
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status },
    );
  }

  try {
    await recordMarketingOptInFromSubscribe(email);
  } catch {
    // Local preference is best-effort; Brevo subscription already succeeded.
  }

  return NextResponse.json({
    ok: true,
    ...(result.already ? { already: true } : {}),
  });
}
