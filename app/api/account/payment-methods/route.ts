import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.savedPaymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: list });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    label?: string | null;
    brand: string;
    last4: string;
    expMonth?: number | null;
    expYear?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const brand = String(body.brand || "").trim();
  const last4 = String(body.last4 || "").replace(/\D/g, "").slice(0, 4);
  if (!brand || last4.length !== 4) {
    return NextResponse.json(
      { error: "Brand and last 4 digits are required" },
      { status: 400 },
    );
  }

  const created = await prisma.savedPaymentMethod.create({
    data: {
      userId: session.user.id,
      label: body.label != null ? String(body.label).trim() || null : null,
      brand,
      last4,
      expMonth: body.expMonth ?? null,
      expYear: body.expYear ?? null,
    },
  });

  return NextResponse.json(created);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const result = await prisma.savedPaymentMethod.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
