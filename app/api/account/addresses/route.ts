import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TYPES = ["billing", "shipping"] as const;

type AddrBody = {
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
};

function normalizeAddr(raw: unknown): AddrBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const line1 = String(o.line1 || "").trim();
  const city = String(o.city || "").trim();
  const postalCode = String(o.postalCode || "").trim();
  const country = String(o.country || "").trim();
  if (!line1 || !city || !postalCode || !country) return null;
  return {
    line1,
    line2: o.line2 != null ? String(o.line2).trim() || null : null,
    city,
    state: o.state != null ? String(o.state).trim() || null : null,
    postalCode,
    country,
    phone: o.phone != null ? String(o.phone).trim() || null : null,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
  });

  const billing = rows.find((r) => r.type === "billing") ?? null;
  const shipping = rows.find((r) => r.type === "shipping") ?? null;

  return NextResponse.json({ billing, shipping });
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
    const addr = normalizeAddr(raw);
    if (!addr) {
      return NextResponse.json(
        { error: `Invalid ${t} address (line1, city, postal code, country required)` },
        { status: 400 },
      );
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
