export const DEFAULT_ANNOUNCEMENT_BACKGROUND = "#0f1114";

/** Fixed bar height — keep in sync with layout/header offset calculations. */
export const SITE_ANNOUNCEMENT_BAR_HEIGHT_PX = 36;

/** Autoplay interval for multi-slide announcement bar (ms). */
export const SITE_ANNOUNCEMENT_ROTATE_MS = 5000;

export type SiteAnnouncementSlide = {
  message: string;
  href: string;
};

export type SiteAnnouncementData = {
  enabled: boolean;
  slides: SiteAnnouncementSlide[];
  backgroundColor: string;
};

export type SaveSiteAnnouncementResult = {
  colorSaved: boolean;
};

function normalizeSlideHref(raw: string | null | undefined): string {
  return String(raw ?? "").trim();
}

function normalizeSlideMessage(raw: string | null | undefined): string {
  return String(raw ?? "").trim();
}

export function normalizeAnnouncementSlides(
  slides: SiteAnnouncementSlide[] | null | undefined,
): SiteAnnouncementSlide[] {
  if (!Array.isArray(slides)) return [];
  const out: SiteAnnouncementSlide[] = [];
  for (const slide of slides) {
    const message = normalizeSlideMessage(slide?.message);
    if (!message) continue;
    out.push({
      message,
      href: normalizeSlideHref(slide?.href),
    });
  }
  return out;
}

export function parseAnnouncementSlidesJson(
  raw: string | null | undefined,
  legacy?: { message?: string; href?: string },
): SiteAnnouncementSlide[] {
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const slides = normalizeAnnouncementSlides(
          parsed.map((item) => {
            if (!item || typeof item !== "object") return { message: "", href: "" };
            const row = item as { message?: unknown; href?: unknown };
            return {
              message: String(row.message ?? ""),
              href: String(row.href ?? ""),
            };
          }),
        );
        if (slides.length > 0) return slides;
      }
    } catch {
      /* fall through to legacy fields */
    }
  }

  const legacyMessage = normalizeSlideMessage(legacy?.message);
  if (!legacyMessage) return [];
  return [{ message: legacyMessage, href: normalizeSlideHref(legacy?.href) }];
}

export function serializeAnnouncementSlides(
  slides: SiteAnnouncementSlide[],
): string {
  return JSON.stringify(normalizeAnnouncementSlides(slides));
}

export function normalizeAnnouncementBackgroundColor(
  raw: string | null | undefined,
): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

/** Pick light or dark text for readable contrast on the bar background. */
export function announcementBarTextColor(backgroundColor: string): string {
  const normalized = normalizeAnnouncementBackgroundColor(backgroundColor);
  if (!normalized) return "#ffffff";

  const hex = normalized.slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? DEFAULT_ANNOUNCEMENT_BACKGROUND : "#ffffff";
}

export function validateAnnouncementSlideHref(href: string): boolean {
  if (!href) return true;
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}
