import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SEC = 90 * 24 * 3600;

function signingSecret(): string {
  const s =
    process.env.SUBSCRIBE_MAGIC_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Set SUBSCRIBE_MAGIC_SECRET or AUTH_SECRET for one-click subscribe links.",
      );
    }
    return "dev-subscribe-magic-not-for-production";
  }
  return s;
}

/**
 * One-click subscribe URL (GET). Uses the same base URL as transactional emails — set NEXT_PUBLIC_APP_URL to your live domain in production.
 */
export function buildSubscribeMagicUrl(emailRaw: string, baseUrl: string): string {
  const email = emailRaw.trim().toLowerCase();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const eEnc = Buffer.from(email, "utf8").toString("base64url");
  const sig = createHmac("sha256", signingSecret())
    .update(`${eEnc}|${exp}`)
    .digest("base64url");
  const base = baseUrl.replace(/\/$/, "");
  const q = new URLSearchParams({
    e: eEnc,
    exp: String(exp),
    s: sig,
  });
  return `${base}/api/subscribe/magic?${q.toString()}`;
}

export function parseSubscribeMagicRequest(
  searchParams: URLSearchParams,
): { email: string } | null {
  const eEnc = searchParams.get("e");
  const expStr = searchParams.get("exp");
  const sig = searchParams.get("s");
  if (!eEnc || !expStr || !sig) return null;

  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  let expectedSig: string;
  try {
    expectedSig = createHmac("sha256", signingSecret())
      .update(`${eEnc}|${exp}`)
      .digest("base64url");
  } catch {
    return null;
  }

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const email = Buffer.from(eEnc, "base64url").toString("utf8");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { email };
  } catch {
    return null;
  }
}
