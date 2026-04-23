/**
 * Runs `prisma migrate deploy` with DATABASE_URL from .env / .env.local (same as Next.js).
 * Prisma CLI only auto-loads `.env`, not `.env.local`.
 */
import { execSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "DATABASE_URL is missing. Add it to .env or .env.local in the project root.",
  );
  process.exit(1);
}

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: process.env,
});
