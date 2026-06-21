export type UserDisplayNameInput = {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
};

/** Public label: first + last name → display name → email local part. */
export function userPublicDisplayName(
  user: UserDisplayNameInput | null | undefined,
  fallback = "Guest",
): string {
  if (!user) return fallback;

  const fullName = [user.firstName?.trim(), user.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;

  const display = user.displayName?.trim();
  if (display) return display;

  const email = user.email?.trim();
  if (email) return email;

  return fallback;
}
