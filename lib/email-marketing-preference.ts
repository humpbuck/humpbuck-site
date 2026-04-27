import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function normalizeMarketingEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newToken(): string {
  return randomBytes(24).toString("hex");
}

function newId(): string {
  return randomBytes(16).toString("hex");
}

function rowOptOut(v: unknown): boolean {
  return v === 1 || v === true || v === BigInt(1);
}

/** Ensures a row exists and returns the stable unsubscribe token for links in emails. */
export async function getOrCreateUnsubscribeToken(emailRaw: string): Promise<string> {
  const email = normalizeMarketingEmail(emailRaw);
  const existing = await prisma.$queryRaw<Array<{ unsubscribeToken: string }>>`
    SELECT "unsubscribeToken" FROM "EmailMarketingPreference" WHERE "email" = ${email}
  `;
  const first = existing[0];
  if (first?.unsubscribeToken) return first.unsubscribeToken;

  const id = newId();
  const token = newToken();
  const now = new Date();
  try {
    await prisma.$executeRaw`
      INSERT INTO "EmailMarketingPreference" ("id", "email", "unsubscribeToken", "marketingOptOut", "createdAt", "updatedAt")
      VALUES (${id}, ${email}, ${token}, false, ${now}, ${now})
    `;
  } catch {
    const again = await prisma.$queryRaw<Array<{ unsubscribeToken: string }>>`
      SELECT "unsubscribeToken" FROM "EmailMarketingPreference" WHERE "email" = ${email}
    `;
    if (again[0]?.unsubscribeToken) return again[0].unsubscribeToken;
    throw new Error("Could not create or read EmailMarketingPreference row.");
  }
  return token;
}

export async function isMarketingOptOut(emailRaw: string): Promise<boolean> {
  const email = normalizeMarketingEmail(emailRaw);
  const rows = await prisma.$queryRaw<Array<{ marketingOptOut: unknown }>>`
    SELECT "marketingOptOut" FROM "EmailMarketingPreference" WHERE "email" = ${email}
  `;
  return rowOptOut(rows[0]?.marketingOptOut);
}

/** True only when user has explicitly subscribed and is not opted out. */
export async function isMarketingSubscribed(emailRaw: string): Promise<boolean> {
  const email = normalizeMarketingEmail(emailRaw);
  const rows = await prisma.$queryRaw<Array<{ marketingOptOut: unknown }>>`
    SELECT "marketingOptOut" FROM "EmailMarketingPreference" WHERE "email" = ${email}
  `;
  const first = rows[0];
  if (!first) return false;
  return !rowOptOut(first.marketingOptOut);
}

export async function optOutByToken(
  token: string,
): Promise<{ ok: true; email: string; already: boolean } | { ok: false }> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false };

  const rows = await prisma.$queryRaw<
    Array<{ id: string; email: string; marketingOptOut: unknown }>
  >`
    SELECT "id", "email", "marketingOptOut" FROM "EmailMarketingPreference" WHERE "unsubscribeToken" = ${trimmed}
  `;
  const row = rows[0];
  if (!row) return { ok: false };

  if (rowOptOut(row.marketingOptOut)) {
    return { ok: true, email: row.email, already: true };
  }

  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "EmailMarketingPreference"
    SET "marketingOptOut" = true, "updatedAt" = ${now}
    WHERE "id" = ${row.id}
  `;
  return { ok: true, email: row.email, already: false };
}

/** Call when someone subscribes via the homepage form (re-opt-in). */
export async function recordMarketingOptInFromSubscribe(emailRaw: string): Promise<void> {
  const email = normalizeMarketingEmail(emailRaw);
  const id = newId();
  const token = newToken();
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "EmailMarketingPreference" ("id", "email", "unsubscribeToken", "marketingOptOut", "createdAt", "updatedAt")
    VALUES (${id}, ${email}, ${token}, false, ${now}, ${now})
    ON CONFLICT("email") DO UPDATE SET
      "marketingOptOut" = false,
      "updatedAt" = ${now}
  `;
}

/** Mark an email as opted out; creates row if missing. */
export async function recordMarketingOptOutByEmail(emailRaw: string): Promise<void> {
  const email = normalizeMarketingEmail(emailRaw);
  const token = await getOrCreateUnsubscribeToken(email);
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "EmailMarketingPreference"
    SET "marketingOptOut" = true, "updatedAt" = ${now}
    WHERE "email" = ${email} AND "unsubscribeToken" = ${token}
  `;
}
