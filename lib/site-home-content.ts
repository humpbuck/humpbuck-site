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
  couponTitle: "",
  couponQuestion: "",
  couponSuccessMessage: "",
  couponTagline: "",
  couponBackgroundImageUrl: "",
};

function trimField(value: unknown): string {
  return String(value ?? "").trim();
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
