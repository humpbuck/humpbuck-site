import { NextResponse } from "next/server";
import { ADMIN_INBOX_CATEGORY, createAdminInboxMessage } from "@/lib/admin-inbox";
import { sendTransactionalEmail } from "@/lib/brevo-mail";
import { checkFormRateLimit, formRateLimitKey } from "@/lib/form-rate-limit";
import { getMergedCatalogProductBySlug } from "@/lib/catalog-db";
import { publicSupportEmail } from "@/lib/support-contact";
import {
  isOemInquiryLogoPublicUrl,
  normalizeOemInquiryEmailFolder,
  normalizeOemInquiryId,
} from "@/lib/r2-oem-inquiry-upload";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const MAX_NOTES = 2000;

const CUSTOMIZATION_KEYS = new Set(["dial", "caseBack", "buckle", "crown"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


function customizationLabel(key: string): string {
  if (key === "dial") return "Dial logo";
  if (key === "caseBack") return "Case back logo";
  if (key === "buckle") return "Buckle logo";
  if (key === "crown") return "Crown logo";
  return key;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = text(body.email).toLowerCase();
  const emailFolder = normalizeOemInquiryEmailFolder(email);
  const productSlug = text(body.productSlug);
  const inquiryId = normalizeOemInquiryId(text(body.inquiryId));
  const logoUrl = text(body.logoUrl);
  const logoKey = text(body.logoKey);
  const notes = text(body.notes).slice(0, MAX_NOTES);
  const pageUrl = text(body.pageUrl).slice(0, 500);
  const locale = text(body.locale).slice(0, 16);
  const website = text(body.website);

  const customizations = Array.isArray(body.customizations)
    ? body.customizations
        .map((v) => text(v))
        .filter((v) => CUSTOMIZATION_KEYS.has(v))
    : [];

  if (website) {
    return NextResponse.json({ error: "Request rejected." }, { status: 400 });
  }
  if (!emailFolder) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!productSlug) {
    return NextResponse.json({ error: "Please select a product." }, { status: 400 });
  }
  if (customizations.length === 0) {
    return NextResponse.json(
      { error: "Please select at least one customization placement." },
      { status: 400 },
    );
  }
  if (!inquiryId || !logoUrl || !logoKey) {
    return NextResponse.json({ error: "Please upload your logo (JPG or PNG)." }, { status: 400 });
  }
  if (!isOemInquiryLogoPublicUrl(logoUrl, emailFolder)) {
    return NextResponse.json({ error: "Invalid logo upload." }, { status: 400 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const rateLimit = checkFormRateLimit(
    formRateLimitKey(forwardedFor, email),
    RATE_MAX_REQUESTS,
    RATE_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const product = await getMergedCatalogProductBySlug(productSlug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 400 });
  }

  const supportTo =
    process.env.MERCHANT_NOTIFY_EMAIL?.trim() || publicSupportEmail();
  const nowIso = new Date().toISOString();
  const placementLabels = customizations.map(customizationLabel);
  const oemPriceLabel =
    product.oemOdmPrice != null && product.oemOdmPrice > 0
      ? `USD ${product.oemOdmPrice.toFixed(2)}`
      : "Inquiry";

  const payload = {
    email,
    productSlug,
    productName: product.name,
    oemOdmPrice: product.oemOdmPrice ?? null,
    customizations,
    customizationLabels: placementLabels,
    logoUrl,
    logoKey,
    notes: notes || null,
    pageUrl: pageUrl || null,
    locale: locale || null,
    inquiryId,
    createdAt: nowIso,
    message: `OEM/ODM mockup request — ${product.name} (${placementLabels.join(", ")})`,
  };

  await createAdminInboxMessage({
    category: ADMIN_INBOX_CATEGORY.emailMockupRequest,
    sourceEmail: email,
    payload,
  }).catch((err) => {
    console.error("[oem-inquiry] admin inbox write failed:", err);
  });

  const specsHtml = product.specs
    .filter((s) => s.label && s.value)
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.label)}:</strong> ${escapeHtml(s.value)}</li>`,
    )
    .join("");

  const mail = await sendTransactionalEmail({
    to: supportTo,
    replyTo: { email, name: email.split("@")[0] || email },
    subject: `OEM/ODM mockup request — ${product.name}`,
    htmlContent: `
      <p>Hello,</p>
      <p>A new OEM/ODM mockup request was submitted from the storefront.</p>
      <ul>
        <li><strong>From:</strong> ${escapeHtml(email)}</li>
        <li><strong>Product:</strong> ${escapeHtml(product.name)} (${escapeHtml(productSlug)})</li>
        <li><strong>OEM/ODM unit price:</strong> ${escapeHtml(oemPriceLabel)}</li>
        <li><strong>Customizations:</strong> ${escapeHtml(placementLabels.join(", "))}</li>
        <li><strong>Logo:</strong> <a href="${escapeHtml(logoUrl)}">${escapeHtml(logoUrl)}</a></li>
        ${pageUrl ? `<li><strong>Page:</strong> <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></li>` : ""}
        ${locale ? `<li><strong>Locale:</strong> ${escapeHtml(locale)}</li>` : ""}
        <li><strong>Submitted at:</strong> ${escapeHtml(nowIso)}</li>
      </ul>
      ${specsHtml ? `<p><strong>Product specs</strong></p><ul>${specsHtml}</ul>` : ""}
      ${notes ? `<p><strong>Notes</strong></p><p>${escapeHtml(notes).replaceAll("\n", "<br/>")}</p>` : ""}
      <p style="margin-top:16px;font-size:12px;color:#6b6560;">Reply in your mail client to reach the customer directly.</p>
    `,
    textContent:
      `OEM/ODM mockup request\n` +
      `From: ${email}\n` +
      `Product: ${product.name} (${productSlug})\n` +
      `OEM/ODM unit price: ${oemPriceLabel}\n` +
      `Customizations: ${placementLabels.join(", ")}\n` +
      `Logo: ${logoUrl}\n` +
      (pageUrl ? `Page: ${pageUrl}\n` : "") +
      (locale ? `Locale: ${locale}\n` : "") +
      `Submitted at: ${nowIso}\n` +
      (notes ? `\nNotes:\n${notes}\n` : ""),
  });

  if (!mail.ok) {
    return NextResponse.json(
      { error: "Failed to send request. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
