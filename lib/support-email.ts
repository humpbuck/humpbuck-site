/** Public support inbox (mailto, policies, floating contact). */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@humpbuck.com";

export function supportMailtoHref(): string {
  return `mailto:${SUPPORT_EMAIL}`;
}
