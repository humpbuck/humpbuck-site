import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const direct = process.env.DIRECT_DATABASE_URL?.trim() ?? "";
const database = process.env.DATABASE_URL?.trim() ?? "";
const accelerate =
  database.startsWith("prisma://") || database.startsWith("prisma+postgres://");

if (!direct && accelerate) {
  console.warn(
    "[env] Windows/system DATABASE_URL is Prisma Accelerate, but DIRECT_DATABASE_URL is missing in .env.local.",
  );
  console.warn(
    "[env] Add DIRECT_DATABASE_URL=postgresql://... (Neon) so local `npm run dev` does not use Accelerate.",
  );
}

if (direct && accelerate && direct !== database) {
  console.log("[env] Using DIRECT_DATABASE_URL for local dev (ignoring system Accelerate DATABASE_URL).");
}

if (direct && process.env.CF_WORKERS_BUILD === "1") {
  console.log("[env] Ignoring system CF_WORKERS_BUILD=1 for local dev (Neon direct in .env.local).");
}
