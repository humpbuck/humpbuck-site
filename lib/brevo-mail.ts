const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";

/** Max retry attempts for transient errors (429, 5xx). */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "HUMPBUCK";

  if (!key) {
    return { ok: false, error: "Brevo API key is not configured." };
  }
  if (!senderEmail) {
    return {
      ok: false,
      error: "BREVO_SENDER_EMAIL is not set (use a verified sender in Brevo).",
    };
  }

  const payload = JSON.stringify({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: params.to }],
    ...(params.replyTo
      ? {
          replyTo: {
            email: params.replyTo.email,
            ...(params.replyTo.name ? { name: params.replyTo.name } : {}),
          },
        }
      : {}),
    subject: params.subject,
    htmlContent: params.htmlContent,
    textContent: params.textContent,
  });

  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      const res = await fetch(BREVO_SMTP_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": key,
        },
        body: payload,
      });

      if (res.ok) {
        return { ok: true };
      }

      // Retry on transient errors
      const isTransient = res.status === 429 || res.status >= 500;
      let detail = "";
      try {
        const errJson = (await res.json()) as { message?: string };
        detail = errJson.message ?? JSON.stringify(errJson);
      } catch {
        detail = await res.text().catch(() => "");
      }
      lastError = detail || `HTTP ${res.status}`;

      if (!isTransient) {
        // Non-transient error, don't retry
        return { ok: false, error: lastError };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // Network error — retry
    }
  }

  return { ok: false, error: `Failed after ${MAX_RETRIES + 1} attempts: ${lastError}` };
}
