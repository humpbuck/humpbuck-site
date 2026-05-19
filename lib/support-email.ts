/** Public support inbox (mailto, policies, floating contact). */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";

export function supportMailtoHref(subject?: string): string {
  const params = new URLSearchParams();
  if (subject?.trim()) params.set("subject", subject.trim());
  const q = params.toString();
  return `mailto:${SUPPORT_EMAIL}${q ? `?${q}` : ""}`;
}

/** Works in Chrome when no desktop mail app is configured. */
export function supportGmailComposeHref(subject?: string): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: SUPPORT_EMAIL,
  });
  if (subject?.trim()) params.set("su", subject.trim());
  return `https://mail.google.com/mail/?${params.toString()}`;
}
