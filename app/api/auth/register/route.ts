import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BUYER_AVATAR_PRESET_URLS } from "@/lib/avatar-presets";
import { prisma } from "@/lib/prisma";

/**
 * Buyer sign-up (credentials). Every successful registration persists
 * `passwordHash` (bcrypt cost 12). `auth.ts` credentials provider requires it for login.
 */
export async function POST(req: Request) {
  let body: { email?: string; password?: string; name?: string; avatarPreset?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email || "")
    .toLowerCase()
    .trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "This email is already registered" },
      { status: 409 },
    );
  }

  let image: string | null = null;
  if (body.avatarPreset !== undefined && body.avatarPreset !== null) {
    const idx = Number(body.avatarPreset);
    if (
      !Number.isInteger(idx) ||
      idx < 0 ||
      idx >= BUYER_AVATAR_PRESET_URLS.length
    ) {
      return NextResponse.json(
        {
          error: `Invalid avatar choice (use 0–${BUYER_AVATAR_PRESET_URLS.length - 1} or omit).`,
        },
        { status: 400 },
      );
    }
    image = BUYER_AVATAR_PRESET_URLS[idx] ?? null;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name,
      image,
      passwordHash,
    },
  });

  return NextResponse.json({ ok: true });
}
