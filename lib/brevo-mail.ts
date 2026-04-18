const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
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

  const res = await fetch(BREVO_SMTP_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
    }),
  });

  if (res.ok) {
    return { ok: true };
  }

  let detail = "";
  try {
    const errJson = (await res.json()) as { message?: string };
    detail = errJson.message ?? JSON.stringify(errJson);
  } catch {
    detail = await res.text();
  }
  return { ok: false, error: detail || `HTTP ${res.status}` };
}
