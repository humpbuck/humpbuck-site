import { emailPublicBaseUrl } from "@/lib/email-public-base-url";
import { getR2VariantLineImageUrl } from "@/lib/r2-line-image";
import type { ValidatedLine } from "@/lib/order-lines";
import { R2_ASSETS_PUBLIC_BASE } from "@/lib/r2";
import { isR2PublicObjectUrl } from "@/lib/r2-public-image";
import { SITE_LOCALE } from "@/lib/site-locale";

const EMAIL_THUMB_MAX_BYTES = 180_000;
const EMAIL_THUMB_FETCH_MS = 8_000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatUsdEmail(amount: number): string {
  return new Intl.NumberFormat(SITE_LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function absoluteImageUrl(href: string): string {
  const base = emailPublicBaseUrl();
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${base}${path}`;
}

function lineImageRemoteSrc(line: ValidatedLine): string {
  return line.variantImage || getR2VariantLineImageUrl(line.slug, line.variantId) || "";
}

/** Shared table header for order line-item blocks in transactional email. */
export const EMAIL_ORDER_LINE_ITEMS_TABLE_HEAD = `<thead>
            <tr style="background:#faf9f7;">
              <th align="left" style="padding:10px 8px 10px 12px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;width:76px;">&nbsp;</th>
              <th align="left" style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;">Product</th>
              <th align="center" style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;width:44px;">Qty</th>
              <th align="right" style="padding:10px 12px 10px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#8a8680;width:88px;">Total</th>
            </tr>
          </thead>`;

export function emailOrderLineItemsEmptyRowHtml(): string {
  return `<tr>
        <td colspan="4" style="padding:16px 12px;text-align:center;color:#8a8680;font-size:14px;">No line items on file for this order.</td>
      </tr>`;
}

/**
 * Standard order line rows (thumbnail + product + qty + total) for all merchant/buyer emails.
 */
export async function buildEmailOrderLineItemRowsHtml(
  lines: ValidatedLine[],
  options: { showSku?: boolean } = {},
): Promise<string> {
  if (lines.length === 0) return emailOrderLineItemsEmptyRowHtml();

  const showSku = options.showSku ?? false;

  return (
    await Promise.all(
      lines.map(async (l) => {
        const remoteSrc = lineImageRemoteSrc(l);
        const img = remoteSrc
          ? await emailLineItemImageHtml(absoluteImageUrl(remoteSrc))
          : PLACEHOLDER_DIV;
        const title = escapeHtml(l.name);
        const varLabel = l.variantLabel
          ? `<br/><span style="color:#555;font-size:13px;">${escapeHtml(l.variantLabel)}</span>`
          : "";
        const skuLine = showSku
          ? `<br/><span style="color:#8a8680;font-size:12px;">SKU ${escapeHtml(l.slug.toUpperCase())}</span>`
          : "";
        return `<tr>
        <td style="padding:12px 8px 12px 12px;vertical-align:top;border-bottom:1px solid #ece9e4;">${img}</td>
        <td style="padding:12px 8px;vertical-align:top;border-bottom:1px solid #ece9e4;color:#14120f;">${title}${varLabel}${skuLine}</td>
        <td style="padding:12px 8px;vertical-align:middle;border-bottom:1px solid #ece9e4;text-align:center;font-weight:600;color:#5c5a57;">${l.qty}</td>
        <td style="padding:12px 12px 12px 8px;vertical-align:middle;border-bottom:1px solid #ece9e4;text-align:right;white-space:nowrap;font-weight:600;color:#14120f;font-variant-numeric:tabular-nums;">${formatUsdEmail(l.lineTotalCents / 100)}</td>
      </tr>`;
      }),
    )
  ).join("");
}

/** Map legacy `*.r2.dev` URLs to the production CDN host (same object path). */
export function emailCdnImageUrl(src: string): string {
  const trimmed = src.trim();
  if (!trimmed.startsWith("http")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (
      parsed.hostname.includes(".r2.dev") ||
      parsed.hostname.includes("r2.cloudflarestorage.com")
    ) {
      return `${R2_ASSETS_PUBLIC_BASE.replace(/\/$/, "")}${parsed.pathname}${parsed.search}`;
    }
    if (isR2PublicObjectUrl(trimmed)) {
      const envBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim().replace(/\/$/, "");
      if (envBase && trimmed.startsWith(envBase)) {
        return `${R2_ASSETS_PUBLIC_BASE.replace(/\/$/, "")}${parsed.pathname}${parsed.search}`;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/** 128×128 JPEG via Cloudflare Image Resizing (when host supports `/cdn-cgi/image`). */
export function emailOptimizedImageUrl(src: string): string {
  const cdn = emailCdnImageUrl(src);
  if (!cdn) return "";

  try {
    const host = new URL(cdn).hostname;
    if (host === "assets.humpbuck.com" || host.endsWith(".humpbuck.com")) {
      const pathUrl = new URL(cdn);
      return `${pathUrl.origin}/cdn-cgi/image/width=128,height=128,fit=cover,quality=82,format=jpeg${pathUrl.pathname}${pathUrl.search}`;
    }
  } catch {
    return cdn;
  }

  return cdn;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** Fetch a small thumbnail and return a `data:` URI so the mail client does not hit R2 on open. */
export async function fetchEmailThumbnailDataUri(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMAIL_THUMB_FETCH_MS);
  try {
    const res = await fetch(trimmed, {
      signal: controller.signal,
      headers: { Accept: "image/jpeg,image/webp,image/png,image/*" },
    });
    if (!res.ok) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength <= 0 || buf.byteLength > EMAIL_THUMB_MAX_BYTES) return null;

    const type =
      res.headers.get("content-type")?.split(";")[0]?.trim() ||
      (trimmed.includes("format=jpeg") ? "image/jpeg" : "image/webp");

    return `data:${type};base64,${bytesToBase64(new Uint8Array(buf))}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

const LINE_IMG_STYLE =
  "display:block;width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #ece9e4;background:#f7f6f3;";

const PLACEHOLDER_DIV =
  '<div style="width:64px;height:64px;border-radius:10px;background:#ece9e4;border:1px solid #e0ddd6;"></div>';

/**
 * Email-safe 64×64 line thumbnail: embedded data URI when possible, else optimized CDN URL.
 */
export async function emailLineItemImageHtml(remoteSrc: string): Promise<string> {
  if (!remoteSrc.trim()) return PLACEHOLDER_DIV;

  const cdn = emailCdnImageUrl(remoteSrc);
  const optimized = emailOptimizedImageUrl(cdn);
  const embedded =
    (optimized ? await fetchEmailThumbnailDataUri(optimized) : null) ||
    (cdn && cdn !== optimized ? await fetchEmailThumbnailDataUri(cdn) : null);
  const src = embedded || optimized || cdn || remoteSrc;
  if (!src) return PLACEHOLDER_DIV;

  const safeSrc = src
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<img src="${safeSrc}" alt="" width="64" height="64" style="${LINE_IMG_STYLE}" />`;
}
