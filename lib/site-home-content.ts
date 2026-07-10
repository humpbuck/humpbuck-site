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
  spotlightProductImageUrl: string;
  couponTitle: string;
  couponQuestion: string;
  couponSuccessMessage: string;
  couponTagline: string;
  couponBackgroundImageUrl: string;
  certaintyHeading: string;
  certaintyLead: string;
  certaintyExtraBlocks: string;
  faqItem1Question: string;
  faqItem1Answer: string;
  faqItem2Question: string;
  faqItem2Answer: string;
  faqItem3Question: string;
  faqItem3Answer: string;
  faqItemsJson: string;
  momentsHeading: string;
  momentsLead: string;
  momentsCard1Title: string;
  momentsCard1Description: string;
  momentsCard1DesktopImageUrl: string;
  momentsCard1MobileImageUrl: string;
  momentsCard2Title: string;
  momentsCard2Description: string;
  momentsCard2DesktopImageUrl: string;
  momentsCard2MobileImageUrl: string;
};

export type CertaintyExtraBlock = {
  title: string;
  body: string;
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
  spotlightProductImageUrl: "",
  couponTitle: "",
  couponQuestion: "",
  couponSuccessMessage: "",
  couponTagline: "",
  couponBackgroundImageUrl: "",
  certaintyHeading: "",
  certaintyLead: "",
  certaintyExtraBlocks: "",
  faqItem1Question: "",
  faqItem1Answer: "",
  faqItem2Question: "",
  faqItem2Answer: "",
  faqItem3Question: "",
  faqItem3Answer: "",
  faqItemsJson: "",
  momentsHeading: "",
  momentsLead: "",
  momentsCard1Title: "",
  momentsCard1Description: "",
  momentsCard1DesktopImageUrl: "",
  momentsCard1MobileImageUrl: "",
  momentsCard2Title: "",
  momentsCard2Description: "",
  momentsCard2DesktopImageUrl: "",
  momentsCard2MobileImageUrl: "",
};

function trimField(value: unknown): string {
  return String(value ?? "").trim();
}

/** Fill empty stored fields with built-in defaults so admin inputs show live copy (black), not grey placeholders. */
export function resolveSiteHomeContentForAdminForm(
  stored: SiteHomeContentData,
  fallbacks: SiteHomeContentData,
): SiteHomeContentData {
  const or = (value: string | undefined | null, fallback: string) => {
    const trimmed = String(value ?? "").trim();
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
    spotlightProductImageUrl: or(stored.spotlightProductImageUrl, fallbacks.spotlightProductImageUrl),
    couponTitle: or(stored.couponTitle, fallbacks.couponTitle),
    couponQuestion: or(stored.couponQuestion, fallbacks.couponQuestion),
    couponSuccessMessage: or(stored.couponSuccessMessage, fallbacks.couponSuccessMessage),
    couponTagline: or(stored.couponTagline, fallbacks.couponTagline),
    couponBackgroundImageUrl: or(
      stored.couponBackgroundImageUrl,
      fallbacks.couponBackgroundImageUrl,
    ),
    certaintyHeading: or(stored.certaintyHeading, fallbacks.certaintyHeading),
    certaintyLead: or(stored.certaintyLead, fallbacks.certaintyLead),
    certaintyExtraBlocks: (stored.certaintyExtraBlocks ?? "").trim()
      ? stored.certaintyExtraBlocks
      : fallbacks.certaintyExtraBlocks,
    faqItem1Question: or(stored.faqItem1Question, fallbacks.faqItem1Question),
    faqItem1Answer: or(stored.faqItem1Answer, fallbacks.faqItem1Answer),
    faqItem2Question: or(stored.faqItem2Question, fallbacks.faqItem2Question),
    faqItem2Answer: or(stored.faqItem2Answer, fallbacks.faqItem2Answer),
    faqItem3Question: or(stored.faqItem3Question, fallbacks.faqItem3Question),
    faqItem3Answer: or(stored.faqItem3Answer, fallbacks.faqItem3Answer),
    faqItemsJson: (stored.faqItemsJson ?? "").trim()
      ? stored.faqItemsJson
      : fallbacks.faqItemsJson,
    momentsHeading: or(stored.momentsHeading, fallbacks.momentsHeading),
    momentsLead: or(stored.momentsLead, fallbacks.momentsLead),
    momentsCard1Title: or(stored.momentsCard1Title, fallbacks.momentsCard1Title),
    momentsCard1Description: or(
      stored.momentsCard1Description,
      fallbacks.momentsCard1Description,
    ),
    momentsCard1DesktopImageUrl: or(
      stored.momentsCard1DesktopImageUrl,
      fallbacks.momentsCard1DesktopImageUrl,
    ),
    momentsCard1MobileImageUrl: or(
      stored.momentsCard1MobileImageUrl,
      fallbacks.momentsCard1MobileImageUrl,
    ),
    momentsCard2Title: or(stored.momentsCard2Title, fallbacks.momentsCard2Title),
    momentsCard2Description: or(
      stored.momentsCard2Description,
      fallbacks.momentsCard2Description,
    ),
    momentsCard2DesktopImageUrl: or(
      stored.momentsCard2DesktopImageUrl,
      fallbacks.momentsCard2DesktopImageUrl,
    ),
    momentsCard2MobileImageUrl: or(
      stored.momentsCard2MobileImageUrl,
      fallbacks.momentsCard2MobileImageUrl,
    ),
  };
}

export type HomeFaqItem = {
  question: string;
  answer: string;
};

function faqItemsFromLegacyFields(content: SiteHomeContentData): HomeFaqItem[] {
  return [
    { question: content.faqItem1Question, answer: content.faqItem1Answer },
    { question: content.faqItem2Question, answer: content.faqItem2Answer },
    { question: content.faqItem3Question, answer: content.faqItem3Answer },
  ];
}

export function parseHomeFaqItemsJson(
  raw: string | null | undefined,
  legacy?: SiteHomeContentData,
): HomeFaqItem[] {
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          question: trimField((item as { question?: unknown })?.question),
          answer: trimField((item as { answer?: unknown })?.answer),
        }));
      }
    } catch {
      /* fall through to legacy fields */
    }
  }

  if (legacy) return faqItemsFromLegacyFields(legacy);
  return [];
}

export function serializeHomeFaqItems(items: HomeFaqItem[]): string {
  return JSON.stringify(
    items.map((item) => ({
      question: trimField(item.question),
      answer: trimField(item.answer),
    })),
  );
}

function syncLegacyFaqItemFields(
  items: HomeFaqItem[],
): Pick<
  SiteHomeContentData,
  | "faqItem1Question"
  | "faqItem1Answer"
  | "faqItem2Question"
  | "faqItem2Answer"
  | "faqItem3Question"
  | "faqItem3Answer"
> {
  return {
    faqItem1Question: items[0]?.question ?? "",
    faqItem1Answer: items[0]?.answer ?? "",
    faqItem2Question: items[1]?.question ?? "",
    faqItem2Answer: items[1]?.answer ?? "",
    faqItem3Question: items[2]?.question ?? "",
    faqItem3Answer: items[2]?.answer ?? "",
  };
}

/** Admin FAQ editor — JSON list with legacy/i18n fallbacks per slot. */
export function resolveHomeFaqItemsForAdmin(
  stored: SiteHomeContentData,
  fallbacks: HomeFaqItem[],
): HomeFaqItem[] {
  const items = parseHomeFaqItemsJson(stored.faqItemsJson, stored);
  const count = Math.max(items.length, fallbacks.length, 1);

  return Array.from({ length: count }, (_, index) => {
    const item = items[index];
    const fallback = fallbacks[index];
    const question = trimField(item?.question) || trimField(fallback?.question);
    const answer = trimField(item?.answer) || trimField(fallback?.answer);
    return { question, answer };
  });
}

/** Storefront FAQ — all saved pairs with optional i18n fallbacks per slot. */
export function resolveHomeFaqItems(
  content: SiteHomeContentData,
  fallbacks: HomeFaqItem[],
): HomeFaqItem[] {
  const items = parseHomeFaqItemsJson(content.faqItemsJson, content);
  const count = Math.max(items.length, fallbacks.length);

  return Array.from({ length: count }, (_, index) => {
    const item = items[index];
    const fallback = fallbacks[index];
    const question = trimField(item?.question) || trimField(fallback?.question);
    const answer = trimField(item?.answer) || trimField(fallback?.answer);
    return { question, answer };
  }).filter((item) => item.question && item.answer);
}

/** Admin / homepage — one block per line: `Title | Body`. Blank lines ignored. */
export function parseCertaintyExtraBlocks(raw: string): CertaintyExtraBlock[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            title: trimField((item as { title?: unknown })?.title),
            body: trimField((item as { body?: unknown })?.body),
          }))
          .filter((block) => block.title && block.body);
      }
    } catch {
      /* fall through to line format */
    }
  }

  return trimmed
    .split("\n")
    .map((line) => {
      const pipe = line.indexOf("|");
      if (pipe === -1) return null;
      const title = line.slice(0, pipe).trim();
      const body = line.slice(pipe + 1).trim();
      if (!title || !body) return null;
      return { title, body };
    })
    .filter((block): block is CertaintyExtraBlock => block != null);
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
    spotlightProductImageUrl: bust(content.spotlightProductImageUrl),
    couponBackgroundImageUrl: bust(content.couponBackgroundImageUrl),
    momentsCard1DesktopImageUrl: bust(content.momentsCard1DesktopImageUrl),
    momentsCard1MobileImageUrl: bust(content.momentsCard1MobileImageUrl),
    momentsCard2DesktopImageUrl: bust(content.momentsCard2DesktopImageUrl),
    momentsCard2MobileImageUrl: bust(content.momentsCard2MobileImageUrl),
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
    spotlightProductImageUrl: trimField(input?.spotlightProductImageUrl),
    couponTitle: trimField(input?.couponTitle),
    couponQuestion: trimField(input?.couponQuestion),
    couponSuccessMessage: trimField(input?.couponSuccessMessage),
    couponTagline: trimField(input?.couponTagline),
    couponBackgroundImageUrl: trimField(input?.couponBackgroundImageUrl),
    certaintyHeading: trimField(input?.certaintyHeading),
    certaintyLead: trimField(input?.certaintyLead),
    certaintyExtraBlocks: trimField(input?.certaintyExtraBlocks),
    faqItem1Question: trimField(input?.faqItem1Question),
    faqItem1Answer: trimField(input?.faqItem1Answer),
    faqItem2Question: trimField(input?.faqItem2Question),
    faqItem2Answer: trimField(input?.faqItem2Answer),
    faqItem3Question: trimField(input?.faqItem3Question),
    faqItem3Answer: trimField(input?.faqItem3Answer),
    faqItemsJson: trimField(input?.faqItemsJson),
    momentsHeading: trimField(input?.momentsHeading),
    momentsLead: trimField(input?.momentsLead),
    momentsCard1Title: trimField(input?.momentsCard1Title),
    momentsCard1Description: trimField(input?.momentsCard1Description),
    momentsCard1DesktopImageUrl: trimField(input?.momentsCard1DesktopImageUrl),
    momentsCard1MobileImageUrl: trimField(input?.momentsCard1MobileImageUrl),
    momentsCard2Title: trimField(input?.momentsCard2Title),
    momentsCard2Description: trimField(input?.momentsCard2Description),
    momentsCard2DesktopImageUrl: trimField(input?.momentsCard2DesktopImageUrl),
    momentsCard2MobileImageUrl: trimField(input?.momentsCard2MobileImageUrl),
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
    data.spotlightProductImageUrl,
    data.couponBackgroundImageUrl,
    data.momentsCard1DesktopImageUrl,
    data.momentsCard1MobileImageUrl,
    data.momentsCard2DesktopImageUrl,
    data.momentsCard2MobileImageUrl,
  ];
  for (const url of urls) {
    if (!validateSiteHomeImageUrl(url)) {
      return "Image URLs must start with http:// or https://.";
    }
  }
  return null;
}

export function siteHomeContentFromFormData(formData: FormData): SiteHomeContentData {
  const faqItemsJson = String(formData.get("faqItemsJson") ?? "");
  const faqItems = parseHomeFaqItemsJson(faqItemsJson);
  const legacyFaqFields = syncLegacyFaqItemFields(faqItems);

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
    spotlightProductImageUrl: formData.get("spotlightProductImageUrl"),
    couponTitle: formData.get("couponTitle"),
    couponQuestion: formData.get("couponQuestion"),
    couponSuccessMessage: formData.get("couponSuccessMessage"),
    couponTagline: formData.get("couponTagline"),
    couponBackgroundImageUrl: formData.get("couponBackgroundImageUrl"),
    certaintyHeading: formData.get("certaintyHeading"),
    certaintyLead: formData.get("certaintyLead"),
    certaintyExtraBlocks: formData.get("certaintyExtraBlocks"),
    faqItemsJson: serializeHomeFaqItems(faqItems),
    ...legacyFaqFields,
    momentsHeading: formData.get("momentsHeading"),
    momentsLead: formData.get("momentsLead"),
    momentsCard1Title: formData.get("momentsCard1Title"),
    momentsCard1Description: formData.get("momentsCard1Description"),
    momentsCard1DesktopImageUrl: formData.get("momentsCard1DesktopImageUrl"),
    momentsCard1MobileImageUrl: formData.get("momentsCard1MobileImageUrl"),
    momentsCard2Title: formData.get("momentsCard2Title"),
    momentsCard2Description: formData.get("momentsCard2Description"),
    momentsCard2DesktopImageUrl: formData.get("momentsCard2DesktopImageUrl"),
    momentsCard2MobileImageUrl: formData.get("momentsCard2MobileImageUrl"),
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

/** Desktop URL with mobile fallback to desktop. */
export function resolveMomentsCardImageUrls(
  desktopUrl: string,
  mobileUrl: string,
): { desktop: string; mobile: string } {
  const desktop = desktopUrl.trim();
  const mobile = mobileUrl.trim() || desktop;
  return { desktop, mobile };
}

export type SiteHomeAboutFields = Pick<
  SiteHomeContentData,
  "aboutHeading" | "aboutParagraph1" | "aboutImageAlt" | "aboutImageUrl"
>;

export function siteHomeAboutFromFormData(formData: FormData): SiteHomeAboutFields {
  return {
    aboutHeading: trimField(formData.get("aboutHeading")),
    aboutParagraph1: trimField(formData.get("aboutParagraph1")),
    aboutImageAlt: trimField(formData.get("aboutImageAlt")),
    aboutImageUrl: trimField(formData.get("aboutImageUrl")),
  };
}

export function validateSiteHomeAboutFields(data: SiteHomeAboutFields): string | null {
  if (!validateSiteHomeImageUrl(data.aboutImageUrl)) {
    return "Image URL must start with http:// or https://.";
  }
  return null;
}

export function mergeSiteHomeAboutFields(
  content: SiteHomeContentData,
  about: SiteHomeAboutFields,
): SiteHomeContentData {
  return normalizeSiteHomeContent({
    ...content,
    ...about,
    aboutParagraph2: "",
  });
}
