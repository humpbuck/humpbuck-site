/** E.164 digits only (no +) — used in `wa.me` links site-wide. */
export const WHATSAPP_E164 = "8618928160416";

/** WhatsApp chat link — same number across checkout, homepage, policies, etc. */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_E164}`;

/** Human-readable number for buyer-facing copy. */
export const WHATSAPP_DISPLAY = "+86 189 2816 0416";

/** E.164 for `wa.me` — env override matches checkout / email (`NEXT_PUBLIC_WHATSAPP_E164`). */
export function publicWhatsAppE164(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_E164?.trim() || WHATSAPP_E164;
}

/** Pre-filled `wa.me` message: product page (name + URL) or any page (URL). */
export type WhatsAppInquiryContext =
  | { kind: "product"; productName: string; pageUrl: string }
  | { kind: "page"; pageUrl: string };

export function whatsappInquiryHref(ctx: WhatsAppInquiryContext): string {
  const body =
    ctx.kind === "product"
      ? `Hi, I have a question about ${ctx.productName}:\n${ctx.pageUrl}`
      : `Hi, I have a question about this page:\n${ctx.pageUrl}`;
  return whatsappHrefWithBody(body);
}

/** Build a `wa.me` link with an arbitrary (UTF-8) message body. */
export function whatsappHrefWithBody(body: string): string {
  const text = encodeURIComponent(body);
  return `https://wa.me/${publicWhatsAppE164()}?text=${text}`;
}

/**
 * @deprecated Prefer {@link whatsappInquiryHref} with `{ kind: "product", productName, pageUrl }`.
 */
export function whatsappProductInquiryHref(productPageAbsoluteUrl: string): string {
  return whatsappInquiryHref({
    kind: "product",
    productName: "this product",
    pageUrl: productPageAbsoluteUrl,
  });
}
