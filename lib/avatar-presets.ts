/**
 * 30 built-in avatars: **Open Peeps**-style (DiceBear `open-peeps` PNG) or, when
 * `NEXT_PUBLIC_AVATAR_PRESETS_FROM_R2=1`, the same 30 files on R2
 * `Avatar/presets/open-peep-01.png` … (see `scripts/upload-open-peep-presets-to-r2.ts`).
 *
 * **Default is DiceBear** so presets always load even if R2 is not populated.
 * [Open Peeps / Pablo Stanley](https://www.openpeeps.com/) (CC0). Grayscale
 * via `clothing`/`skin`/`hair` color arrays; override with
 * `NEXT_PUBLIC_AVATAR_PRESET_OPEN_PEEP_TONE=color`. Public R2 base:
 * `NEXT_PUBLIC_R2_PUBLIC_BASE` or `lib/r2.ts` `R2_PUBLIC_BASE`.
 */
import { R2_PUBLIC_BASE } from "./r2";

const GRAY_SKIN = "e8e8e8,d5d5d5,c2c2c2,afafaf,9c9c9c";
const GRAY_CLOTHING = "2a2a2a,3d3d3d,505050,636363,767676,898989,9c9c9c";
const GRAY_HAIR =
  "0a0a0a,1a1a1a,2a2a2a,3a3a3a,4a4a4a,5a5a5a,6a6a6a,7a7a7a,8a8a8a,9a9a9a";

function r2PublicBaseForPresets(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

function usePresetsFromR2(): boolean {
  const v = process.env.NEXT_PUBLIC_AVATAR_PRESETS_FROM_R2?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function r2OpenPeepPresetUrl(i: number): string {
  const n = String(i + 1).padStart(2, "0");
  const segs = `Avatar/presets/open-peep-${n}.png`
    .split("/")
    .map((p) => encodeURIComponent(p));
  return `${r2PublicBaseForPresets()}/${segs.join("/")}`;
}

function dicebearOpenPeepPresetUrl(i: number): string {
  const u = new URL("https://api.dicebear.com/7.x/open-peeps/png");
  u.searchParams.set("seed", `humpbuck-preset-${String(i + 1).padStart(2, "0")}`);
  u.searchParams.set("size", "150");
  u.searchParams.set("backgroundColor", "ffffff");
  const tone = (
    process.env.NEXT_PUBLIC_AVATAR_PRESET_OPEN_PEEP_TONE ?? "gray"
  ).toLowerCase();
  if (tone !== "color") {
    u.searchParams.set("skinColor", GRAY_SKIN);
    u.searchParams.set("clothingColor", GRAY_CLOTHING);
    u.searchParams.set("headContrastColor", GRAY_HAIR);
  }
  return u.toString();
}

export const BUYER_AVATAR_PRESET_COUNT = 30;

export const BUYER_AVATAR_PRESET_URLS: readonly string[] = Array.from(
  { length: BUYER_AVATAR_PRESET_COUNT },
  (_, i) =>
    usePresetsFromR2() ? r2OpenPeepPresetUrl(i) : dicebearOpenPeepPresetUrl(i),
);

/** R2 `Avatar/presets/open-peep-NN.png` on our public host(s) — allowed when we default to DiceBear. */
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
  const hosts = new Set<string>();
  for (const base of [r2PublicBaseForPresets(), R2_PUBLIC_BASE]) {
    try {
      hosts.add(new URL(base).host);
    } catch {
      /* skip */
    }
  }
  return hosts.has(u.hostname);
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
