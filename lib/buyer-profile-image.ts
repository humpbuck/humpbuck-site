import { assertAvatarUrlForUser } from "@/lib/r2-avatar-upload";
import { isAllowedBuiltinPresetImageUrl } from "@/lib/avatar-presets";

/**
 * Normalizes and validates `User.image` for buyer-set avatars (30 built-in presets or own R2 upload).
 */
export function normalizeBuyerProfileImage(
  userId: string,
  image: string | null | undefined,
): string | null {
  if (image == null) return null;
  const t = String(image).trim();
  if (!t) return null;
  if (isAllowedBuiltinPresetImageUrl(t)) return t;
  assertAvatarUrlForUser(userId, t);
  return t;
}
