import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateInternationalPhone } from "@/lib/phone-normalize";
import { prisma } from "@/lib/prisma";
import { normalizeUserAddressInput } from "@/lib/user-address-normalize";

const TYPES = ["billing", "shipping"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = session.user.id;
  const [rows, profile] = await Promise.all([
    prisma.userAddress.findMany({ where: { userId: uid } }),
    prisma.user.findUnique({
      where: { id: uid },
      select: { firstName: true, lastName: true },
    }),
  ]);

  const billing = rows.find((r) => r.type === "billing") ?? null;
  const shipping = rows.find((r) => r.type === "shipping") ?? null;

  return NextResponse.json({
    billing,
    shipping,
    profile: {
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { billing?: unknown; shipping?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uid = session.user.id;

  for (const t of TYPES) {
    const key = t as "billing" | "shipping";
    const raw = body[key];
    if (raw === undefined) continue;
    if (raw === null) {
      await prisma.userAddress.deleteMany({
        where: { userId: uid, type: t },
      });
      continue;
    }
    const addr = normalizeUserAddressInput(raw);
    if (!addr) {
      return NextResponse.json(
        { error: `Invalid ${t} address (line1, city, postal code, country required)` },
        { status: 400 },
      );
    }
    const phoneCheck = validateInternationalPhone(addr.phone, {
      required: false,
      label: `${t[0]?.toUpperCase() ?? ""}${t.slice(1)} phone`,
    });
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }
    await prisma.userAddress.upsert({
      where: {
        userId_type: { userId: uid, type: t },
      },
      create: {
        userId: uid,
        type: t,
        ...addr,
      },
      update: addr,
    });
  }

  return NextResponse.json({ ok: true });
}
