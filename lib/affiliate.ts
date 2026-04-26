export const AFFILIATE_MIN_FOLLOWERS = 1000;

export function parseAffiliateSocialLinks(raw: string): string[] {
  const parts = raw
    .split(/\r?\n|,/g)
    .map((x) => x.trim())
    .filter(Boolean);
  const unique = new Set<string>();
  for (const p of parts) {
    unique.add(p);
  }
  return [...unique].slice(0, 20);
}

export function parseAffiliateFollowerCount(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  const n = Math.floor(Number(text));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function evaluateAffiliateRisk(input: {
  followerCount: number | null;
  socialLinks: string[];
  isBlacklisted: boolean;
}): { highRisk: boolean; reason: string | null } {
  if (input.isBlacklisted) {
    return { highRisk: true, reason: "User is currently blacklisted." };
  }
  if (input.socialLinks.length === 0) {
    return { highRisk: true, reason: "No social links were provided." };
  }
  if (input.followerCount == null) {
    return { highRisk: true, reason: "Follower count is missing." };
  }
  if (input.followerCount < AFFILIATE_MIN_FOLLOWERS) {
    return {
      highRisk: true,
      reason: `Follower count is below ${AFFILIATE_MIN_FOLLOWERS}.`,
    };
  }
  return { highRisk: false, reason: null };
}

