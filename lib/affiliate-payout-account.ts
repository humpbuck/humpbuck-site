/**
 * Affiliate payoutAccount historically duplicated WhatsApp as "WhatsApp: …"
 * (sometimes on its own line, sometimes glued to PayPal email without a newline).
 * WhatsApp belongs in AffiliateProfile.whatsapp only.
 */

export function sanitizeAffiliatePayoutWhatsappContact(value: string): string {
  return value.replace(/^whatsapp:\s*/i, "").trim();
}

/** Removes embedded WhatsApp lines and trailing "WhatsApp: …" fragments from each line. */
export function stripEmbeddedWhatsAppFromPayoutAccount(payload: string | null | undefined): string {
  const raw = String(payload ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/WhatsApp:\s*.+$/i, "").trimEnd())
    .filter((line) => {
      const t = line.trim();
      return Boolean(t) && !/^WhatsApp:\s*/i.test(t);
    })
    .join("\n")
    .trim();
}
