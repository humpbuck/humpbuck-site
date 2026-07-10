import { withImageCacheRevision } from "@/lib/r2-public-image";

export type SiteHomeContentData = {
  heroBadge: string;
  heroTitle: string;
  heroLead: string;
  heroChip1: string;
  heroChip2: string;
  heroChip3: string;
  heroCtaShop: string;
  heroImageAlt: string;
  heroDesktopImageUrl: string;
  heroMobileImageUrl: string;
  aboutHeading: string;
  aboutParagraph1: string;
  aboutParagraph2: string;
  aboutImageAlt: string;
  aboutImageUrl: string;
  spotlightBackgroundImageUrl: string;
  spotlightBackgroundMobileImageUrl: string;
  couponTitle: string;
  couponQuestion: string;
  couponSuccessMessage: string;
  couponTagline: string;
  couponBackgroundImageUrl: string;
};

export const EMPTY_SITE_HOME_CONTENT: SiteHomeContentData = {
  heroBadge: "",
  heroTitle: "",
  heroLead: "",
  heroChip1: "",
  heroChip2: "",
  heroChip3: "",
  heroCtaShop: "",
  heroImageAlt: "",
  heroDesktopImageUrl: "",
  heroMobileImageUrl: "",
  aboutHeading: "",
  aboutParagraph1: "",
  aboutParagraph2: "",
  aboutImageAlt: "",
  aboutImageUrl: "",
  spotlightBackgroundImageUrl: "",
  spotlightBackgroundMobileImageUrl: "",
  couponTitle: "",
  couponQuestion: "",
  couponSuccessMessage: "",
  couponTagline: "",
  couponBackgroundImageUrl: "",
};

function trimField(value: unknown): string {
  return String(value ?? "").trim();
}

/** Fill empty stored fields with built-in defaults so admin inputs show live copy (black), not grey placeholders. */
export function resolveSiteHomeContentForAdminForm(
  stored: SiteHomeContentData,
  fallbacks: SiteHomeContentData,
): SiteHomeContentData {
  const or = (value: string, fallback: string) => {
    const trimmed = value.trim();
    return trimmed || fallback;
  };

  return {
    heroBadge: or(stored.heroBadge, fallbacks.heroBadge),
    heroTitle: or(stored.heroTitle, fallbacks.heroTitle),
    heroLead: or(stored.heroLead, fallbacks.heroLead),
    heroChip1: or(stored.heroChip1, fallbacks.heroChip1),
    heroChip2: or(stored.heroChip2, fallbacks.heroChip2),
    heroChip3: or(stored.heroChip3, fallbacks.heroChip3),
    heroCtaShop: or(stored.heroCtaShop, fallbacks.heroCtaShop),
    heroImageAlt: or(stored.heroImageAlt, fallbacks.heroImageAlt),
    heroDesktopImageUrl: or(stored.heroDesktopImageUrl, fallbacks.heroDesktopImageUrl),
    heroMobileImageUrl: or(stored.heroMobileImageUrl, fallbacks.heroMobileImageUrl),
    aboutHeading: or(stored.aboutHeading, fallbacks.aboutHeading),
    aboutParagraph1: or(stored.aboutParagraph1, fallbacks.aboutParagraph1),
    aboutParagraph2: or(stored.aboutParagraph2, fallbacks.aboutParagraph2),
    aboutImageAlt: or(stored.aboutImageAlt, fallbacks.aboutImageAlt),
    aboutImageUrl: or(stored.aboutImageUrl, fallbacks.aboutImageUrl),
    spotlightBackgroundImageUrl: or(
      stored.spotlightBackgroundImageUrl,
      fallbacks.spotlightBackgroundImageUrl,
    ),
    spotlightBackgroundMobileImageUrl: or(
      stored.spotlightBackgroundMobileImageUrl,
      fallbacks.spotlightBackgroundMobileImageUrl,
    ),
    couponTitle: or(stored.couponTitle, fallbacks.couponTitle),
    couponQuestion: or(stored.couponQuestion, fallbacks.couponQuestion),
    couponSuccessMessage: or(stored.couponSuccessMessage, fallbacks.couponSuccessMessage),
    couponTagline: or(stored.couponTagline, fallbacks.couponTagline),
    couponBackgroundImageUrl: or(
      stored.couponBackgroundImageUrl,
      fallbacks.couponBackgroundImageUrl,
    ),
  };
}

/** Storefront-only — bust R2 image caches using `SiteHomeContent.updatedAt` after admin saves. */
export function applySiteHomeImageCacheRevision(
  content: SiteHomeContentData,
  revision: string | null,
): SiteHomeContentData {
  if (!revision) return content;
  const bust = (url: string) => withImageCacheRevision(url, revision);
  return {
    ...content,
    heroDesktopImageUrl: bust(content.heroDesktopImageUrl),
    heroMobileImageUrl: bust(content.heroMobileImageUrl),
    aboutImageUrl: bust(content.aboutImageUrl),
    spotlightBackgroundImageUrl: bust(content.spotlightBackgroundImageUrl),
    spotlightBackgroundMobileImageUrl: bust(content.spotlightBackgroundMobileImageUrl),
    couponBackgroundImageUrl: bust(content.couponBackgroundImageUrl),
  };
}

export function normalizeSiteHomeContent(
  input: Partial<Record<keyof SiteHomeContentData, unknown>> | null | undefined,
): SiteHomeContentData {
  return {
    heroBadge: trimField(input?.heroBadge),
    heroTitle: trimField(input?.heroTitle),
    heroLead: trimField(input?.heroLead),
    heroChip1: trimField(input?.heroChip1),
    heroChip2: trimField(input?.heroChip2),
    heroChip3: trimField(input?.heroChip3),
    heroCtaShop: trimField(input?.heroCtaShop),
    heroImageAlt: trimField(input?.heroImageAlt),
    heroDesktopImageUrl: trimField(input?.heroDesktopImageUrl),
    heroMobileImageUrl: trimField(input?.heroMobileImageUrl),
    aboutHeading: trimField(input?.aboutHeading),
    aboutParagraph1: trimField(input?.aboutParagraph1),
    aboutParagraph2: trimField(input?.aboutParagraph2),
    aboutImageAlt: trimField(input?.aboutImageAlt),
    aboutImageUrl: trimField(input?.aboutImageUrl),
    spotlightBackgroundImageUrl: trimField(input?.spotlightBackgroundImageUrl),
    spotlightBackgroundMobileImageUrl: trimField(input?.spotlightBackgroundMobileImageUrl),
    couponTitle: trimField(input?.couponTitle),
    couponQuestion: trimField(input?.couponQuestion),
    couponSuccessMessage: trimField(input?.couponSuccessMessage),
    couponTagline: trimField(input?.couponTagline),
    couponBackgroundImageUrl: trimField(input?.couponBackgroundImageUrl),
  };
}

export function validateSiteHomeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

export function validateSiteHomeContent(data: SiteHomeContentData): string | null {
  const urls = [
    data.heroDesktopImageUrl,
    data.heroMobileImageUrl,
    data.aboutImageUrl,
    data.spotlightBackgroundImageUrl,
    data.spotlightBackgroundMobileImageUrl,
    data.couponBackgroundImageUrl,
  ];
  for (const url of urls) {
    if (!validateSiteHomeImageUrl(url)) {
      return "Image URLs must start with http:// or https://.";
    }
  }
  return null;
}

export function siteHomeContentFromFormData(formData: FormData): SiteHomeContentData {
  return normalizeSiteHomeContent({
    heroBadge: formData.get("heroBadge"),
    heroTitle: formData.get("heroTitle"),
    heroLead: formData.get("heroLead"),
    heroChip1: formData.get("heroChip1"),
    heroChip2: formData.get("heroChip2"),
    heroChip3: formData.get("heroChip3"),
    heroCtaShop: formData.get("heroCtaShop"),
    heroImageAlt: formData.get("heroImageAlt"),
    heroDesktopImageUrl: formData.get("heroDesktopImageUrl"),
    heroMobileImageUrl: formData.get("heroMobileImageUrl"),
    aboutHeading: formData.get("aboutHeading"),
    aboutParagraph1: formData.get("aboutParagraph1"),
    aboutParagraph2: formData.get("aboutParagraph2"),
    aboutImageAlt: formData.get("aboutImageAlt"),
    aboutImageUrl: formData.get("aboutImageUrl"),
    spotlightBackgroundImageUrl: formData.get("spotlightBackgroundImageUrl"),
    spotlightBackgroundMobileImageUrl: formData.get("spotlightBackgroundMobileImageUrl"),
    couponTitle: formData.get("couponTitle"),
    couponQuestion: formData.get("couponQuestion"),
    couponSuccessMessage: formData.get("couponSuccessMessage"),
    couponTagline: formData.get("couponTagline"),
    couponBackgroundImageUrl: formData.get("couponBackgroundImageUrl"),
  });
}

export function formatCouponSuccessMessage(template: string, code: string): string {
  if (template.includes("{code}")) {
    return template.replaceAll("{code}", code);
  }
  return `${template}${code}`;
}

export function resolveCouponTaglineLines(
  stored: string,
  fallbackLine1: string,
  fallbackLine2: string,
): { line1: string; line2: string } {
  const trimmed = stored.trim();
  if (!trimmed) {
    return { line1: fallbackLine1, line2: fallbackLine2 };
  }
  if (trimmed.includes("\n")) {
    const [first, ...rest] = trimmed.split("\n");
    return { line1: first.trim(), line2: rest.join("\n").trim() };
  }
  const semi = trimmed.indexOf("; ");
  if (semi !== -1) {
    let line1 = trimmed.slice(0, semi).trim();
    let line2 = trimmed.slice(semi + 2).trim();
    if (line1 && !line1.endsWith(".")) line1 += ".";
    if (line2 && line2[0] >= "a" && line2[0] <= "z") {
      line2 = `${line2[0].toUpperCase()}${line2.slice(1)}`;
    }
    return { line1, line2 };
  }
  return { line1: trimmed, line2: fallbackLine2 };
}

/** Desktop URL with mobile fallback to desktop, then optional built-in default. */
export function resolveSpotlightBackgroundUrls(
  content: SiteHomeContentData,
  defaultDesktop: string,
): { desktop: string; mobile: string } {
  const desktop = content.spotlightBackgroundImageUrl.trim() || defaultDesktop;
  const mobile = content.spotlightBackgroundMobileImageUrl.trim() || desktop;
  return { desktop, mobile };
}
