/** Buyer-facing support email (works in client components when NEXT_PUBLIC_* is set). */
export function publicSupportEmail(): string {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "support@humpbuck.com"
  );
}
