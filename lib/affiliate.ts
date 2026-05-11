export const AFFILIATE_MIN_FOLLOWERS = 1000;

export function parseAffiliateSocialLinks(raw: string): string[] {
  return [...new Set(raw.split(/\r?\n|,/g).map((x) => x.trim()).filter(Boolean))].slice(0, 20);
}

export function parseAffiliateFollowerCount(raw: string): number | null {
  const n = Math.floor(Number(raw.trim()));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function evaluateAffiliateRisk(input: {
  followerCount: number | null;
  socialLinks: string[];
  isBlacklisted: boolean;
}): { highRisk: boolean; reason: string | null } {
  if (input.isBlacklisted) return { highRisk: true, reason: "User is currently blacklisted." };
  if (!input.socialLinks.length) return { highRisk: true, reason: "No social links were provided." };
  if (input.followerCount == null) return { highRisk: true, reason: "Follower count is missing." };
  if (input.followerCount < AFFILIATE_MIN_FOLLOWERS) {
    return { highRisk: true, reason: `Follower count is below ${AFFILIATE_MIN_FOLLOWERS}.` };
  }
  return { highRisk: false, reason: null };
}

export function buildAffiliatePidSeed(input: {
  email?: string | null;
  userId: string;
}): string {
  const fromEmail = String(input.email ?? "")
    .trim()
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 18);
  const suffix = input.userId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
  const head = fromEmail || "partner";
  return `${head}-${suffix}`;
}

