const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";

export type BrevoSubscribeResult =
  | { ok: true; already?: boolean }
  | { ok: false; error: string; detail?: string };

/**
 * Adds an email to the configured Brevo list (same as POST /api/subscribe).
 */
export async function addEmailToBrevoNewsletter(
  emailRaw: string,
): Promise<BrevoSubscribeResult> {
  const key = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;

  if (!key?.trim() || !listIdRaw?.trim()) {
    return { ok: false, error: "Newsletter is not configured." };
  }

  const listId = Number.parseInt(listIdRaw.trim(), 10);
  if (Number.isNaN(listId) || listId < 1) {
    return { ok: false, error: "Invalid newsletter configuration." };
  }

  const email = emailRaw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email." };
  }

  const res = await fetch(BREVO_CONTACTS_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": key.trim(),
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
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

  if (res.status === 400 && /duplicate|already exists|contact already/i.test(detail)) {
    return { ok: true, already: true };
  }

  return {
    ok: false,
    error: "Could not subscribe right now.",
    detail,
  };
}
