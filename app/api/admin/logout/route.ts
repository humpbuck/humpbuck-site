import { NextResponse } from "next/server";
import { adminLoginPath } from "@/lib/admin-path";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL(adminLoginPath(), request.url));
  res.cookies.set(ADMIN_COOKIE, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });
  return res;
}
