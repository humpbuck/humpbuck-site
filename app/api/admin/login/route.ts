import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminSecretMatches,
  signAdminSession,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET.length < 8) {
    return NextResponse.json(
      { error: "Admin is not configured (set ADMIN_SECRET in .env)." },
      { status: 503 },
    );
  }

  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secret = String(body.secret ?? "");
  if (!adminSecretMatches(secret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const token = signAdminSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
