import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userPublicDisplayName } from "@/lib/user-display-name";

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
    image?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.image !== undefined) {
    return NextResponse.json(
      { error: "Profile photos are not supported." },
      { status: 400 },
    );
  }

  const firstName =
    body.firstName === undefined
      ? undefined
      : String(body.firstName || "").trim() || null;
  const lastName =
    body.lastName === undefined
      ? undefined
      : String(body.lastName || "").trim() || null;
  const displayName =
    body.displayName === undefined
      ? undefined
      : String(body.displayName || "").trim() || null;

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, displayName: true, email: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextFirst = firstName !== undefined ? firstName : existing.firstName;
  const nextLast = lastName !== undefined ? lastName : existing.lastName;
  const nextDisplay =
    displayName !== undefined ? displayName : existing.displayName;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(displayName !== undefined ? { displayName } : {}),
      name: userPublicDisplayName({
        firstName: nextFirst,
        lastName: nextLast,
        displayName: nextDisplay,
        email: existing.email,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
