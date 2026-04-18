import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
      name: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName:
        body.firstName === undefined
          ? undefined
          : String(body.firstName || "").trim() || null,
      lastName:
        body.lastName === undefined
          ? undefined
          : String(body.lastName || "").trim() || null,
      displayName:
        body.displayName === undefined
          ? undefined
          : String(body.displayName || "").trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
