/**
 * 30 built-in profile avatars — **PNG files on R2** under
 * `Avatar/avatars-default/avatars 01.png` … `avatars 30.png` (space before the number).
 *
 * Public base: `NEXT_PUBLIC_R2_PUBLIC_BASE` or `lib/r2.ts` `R2_PUBLIC_BASE`.
 * Ensure that hostname is in `next.config.ts` → `images.remotePatterns`.
 *
 * Legacy URLs (DiceBear, older R2 `Avatar/presets/open-peep-*.png`, etc.) stay
 * accepted in `isAllowedBuiltinPresetImageUrl` for existing `User.image` values.
 */
import { R2_PUBLIC_BASE } from "./r2";

function r2PublicBaseForPresets(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

/** e.g. `Avatar/avatars-default/avatars 01.png` → URL-safe segments */
function r2DefaultAvatarsPresetUrl(i: number): string {
  const n = String(i + 1).padStart(2, "0");
  const segs = `Avatar/avatars-default/avatars ${n}.png`
    .split("/")
    .map((p) => encodeURIComponent(p));
  return `${r2PublicBaseForPresets()}/${segs.join("/")}`;
}

export const BUYER_AVATAR_PRESET_COUNT = 30;

export const BUYER_AVATAR_PRESET_URLS: readonly string[] = Array.from(
  { length: BUYER_AVATAR_PRESET_COUNT },
  (_, i) => r2DefaultAvatarsPresetUrl(i),
);

/** R2 `Avatar/avatars-default/avatars NN.png` (space before index) */
const R2_DEFAULT_AVATARS_PATH_RE =
  /^\/Avatar\/avatars-default\/avatars (?:0[1-9]|1[0-9]|2[0-9]|30)\.png$/;

function r2PresetAllowedHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const base of [r2PublicBaseForPresets(), R2_PUBLIC_BASE]) {
    try {
      hosts.add(new URL(base).host);
    } catch {
      /* skip */
    }
  }
  return hosts;
}

function isHumpbuckR2DefaultAvatarsPresetUrl(s: string): boolean {
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  let path = u.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    /* keep raw */
  }
  if (!R2_DEFAULT_AVATARS_PATH_RE.test(path)) return false;
  return r2PresetAllowedHosts().has(u.hostname);
}

/** Legacy: R2 `Avatar/presets/open-peep-NN.png` */
const OPEN_PEEP_R2_PATH_RE =
  /^\/Avatar\/presets\/open-peep-(?:0[1-9]|1[0-9]|2[0-9]|30)\.png$/;

function isHumpbuckR2OpenPeepPresetUrl(s: string): boolean {
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  if (!OPEN_PEEP_R2_PATH_RE.test(u.pathname)) return false;
  return r2PresetAllowedHosts().has(u.hostname);
}

/** Legacy: Pravatar preset list (still accepted on profile save). */
const LEGACY_PRAVATAR_RE =
  /^https:\/\/i\.pravatar\.cc\/150\?img=(?:[1-9]|1[0-9]|2[0-9]|30)(?:$|&)/;

/** Legacy: DiceBear Micah — still accepted on save. */
const LEGACY_DICEBEAR_MICAH_RE =
  /^https:\/\/api\.dicebear\.com\/7\.x\/micah\/png\?seed=humpbuck-(?:0[1-9]|1[0-9]|2[0-9]|30)&size=150$/;

/** Legacy: DiceBear Rings — still accepted on save. */
const LEGACY_DICEBEAR_RINGS_RE =
  /^https:\/\/api\.dicebear\.com\/7\.x\/rings\/png\?seed=humpbuck-(?:0[1-9]|1[0-9]|2[0-9]|30)&size=150$/;

/** Legacy: DiceBear initials (letter badges) from a previous build — still accepted. */
function isLegacyInitialsUrl(t: string): boolean {
  return (
    t.startsWith("https://api.dicebear.com/7.x/initials/png?") &&
    t.includes("fontColor=") &&
    t.includes("backgroundType=")
  );
}

/** Legacy: DiceBear open-peeps when presets still pointed at api.dicebear.com — still accepted. */
function isLegacyDicebearOpenPeepsUrl(s: string): boolean {
  return (
    s.includes("api.dicebear.com/7.x/open-peeps/png?") &&
    s.includes("humpbuck-preset-")
  );
}

export function isAllowedBuiltinPresetImageUrl(url: string): boolean {
  const s = url.trim();
  if (BUYER_AVATAR_PRESET_URLS.includes(s)) return true;
  if (isHumpbuckR2DefaultAvatarsPresetUrl(s)) return true;
  if (isHumpbuckR2OpenPeepPresetUrl(s)) return true;
  if (LEGACY_PRAVATAR_RE.test(s)) return true;
  if (LEGACY_DICEBEAR_MICAH_RE.test(s)) return true;
  if (LEGACY_DICEBEAR_RINGS_RE.test(s)) return true;
  if (isLegacyInitialsUrl(s)) return true;
  if (isLegacyDicebearOpenPeepsUrl(s)) return true;
  return false;
}

/** @deprecated Use `isAllowedBuiltinPresetImageUrl` */
export const isAllowedPravatarPresetImageUrl = isAllowedBuiltinPresetImageUrl;

export function isPresetAvatarUrl(url: string): boolean {
  return isAllowedBuiltinPresetImageUrl(url);
}
