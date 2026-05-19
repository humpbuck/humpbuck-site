/** Cloudflare Turnstile server-side verification (shared by contact + wholesale forms). */
export async function verifyTurnstileToken(
  token: string,
  ip?: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return false;

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  if (ip) formData.set("remoteip", ip);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: formData },
  );

  if (!result.ok) return false;
  const data = (await result.json().catch(() => null)) as null | {
    success?: boolean;
  };
  return Boolean(data?.success);
}
