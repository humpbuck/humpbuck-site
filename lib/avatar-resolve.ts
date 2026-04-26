import { createHash } from "node:crypto";
import { R2_PUBLIC_BASE } from "./r2";

/**
 * Gravatar — de facto standard: MD5 of lowercased trimmed email, same avatar everywhere
 * (forums, GitHub, etc.) when the user has no custom `User.image`.
 * @see https://docs.gravatar.com/api/avatars/images/
 *
 * **Fallback (letters):** if Gravatar is turned off (env), has no `email`, or the image
 * request fails in the client (`onError` on `HeaderUserAvatar` / `ReviewerAvatar`), the UI
 * shows the first letter of the user’s name or email local-part.
 */
const GRAVATAR_AVATAR = "https://www.gravatar.com/avatar";

/** Set `NEXT_PUBLIC_GRAVATAR_AVATARS=0` when the Gravatar CDN is unreachable — then no URL is returned and the UI uses initials. */
export function isGravatarAvatarsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_GRAVATAR_AVATARS?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return true;
}

export function gravatarUrlForEmail(
  email: string,
  size = 200,
  /** `mp` = “mystery person” (global default for no custom Gravatar). */
  defaultImage: "mp" | "identicon" = "mp",
): string {
  const e = String(email).trim().toLowerCase();
  const hash = createHash("md5").update(e, "utf8").digest("hex");
  return `${GRAVATAR_AVATAR}/${hash}?s=${size}&d=${defaultImage}&r=pg`;
}

const REVIEW_AVATARPERSON_COUNT = 30;

function reviewAvatarR2Base(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

function getDeterministicReviewPresetAvatar(email: string): string {
  const normalized = email.trim().toLowerCase();
  const hashHex = createHash("md5").update(normalized, "utf8").digest("hex");
  const hashInt = Number.parseInt(hashHex.slice(0, 8), 16);
  const idx = (hashInt % REVIEW_AVATARPERSON_COUNT) + 1;
  const n = String(idx).padStart(2, "0");
  return `${reviewAvatarR2Base()}/Avatar/Avatarperson/Avatarperson-${n}.webp`;
}

/**
 * Upload / preset in DB first; else Gravatar when enabled and `email` exists; else `null` (UI: letter).
 */
export function getBuyerAvatarDisplayUrl(input: {
  image: string | null | undefined;
  email: string | null | undefined;
}): string | null {
  const raw = input.image?.trim();
  if (raw) return raw;
  if (!isGravatarAvatarsEnabled()) return null;
  const em = input.email?.trim();
  /* `mp` = grey “mystery person”; `identicon` = geometric pattern. Header/account use this path. */
  if (em) return gravatarUrlForEmail(em, 200, "identicon");
  return null;
}

/**
 * **PDP buyer reviews only:** always use deterministic R2 built-in avatar presets.
 * This intentionally ignores `User.image` to keep review avatars consistent site-wide.
 */
export function getReviewAvatarDisplayUrl(input: {
  image: string | null | undefined;
  email: string | null | undefined;
}): string | null {
  const em = input.email?.trim();
  if (em) return getDeterministicReviewPresetAvatar(em);
  const imageKey = input.image?.trim();
  if (imageKey) {
    return getDeterministicReviewPresetAvatar(imageKey);
  }
  return null;
}
