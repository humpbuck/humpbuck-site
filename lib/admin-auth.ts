import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "humpbuck_admin";

const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export function signAdminSession(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error("ADMIN_SECRET must be set and at least 8 characters.");
  }
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSession(token: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export async function getAdminToken(): Promise<string | undefined> {
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value;
}

export async function assertAdmin(): Promise<void> {
  const token = await getAdminToken();
  if (!token || !verifyAdminSession(token)) {
    redirect("/admin/login");
  }
}

export function adminCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    /** `/` so both `/admin/*` and `/api/admin/*` receive the cookie. */
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

/** Compare login input to ADMIN_SECRET without leaking length via timing. */
export function adminSecretMatches(input: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 8) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(secret, "utf8").digest();
  return timingSafeEqual(a, b);
}
