import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

if (!process.env.DATABASE_URL?.trim()) {
  console.warn("[env] DATABASE_URL is not set — defaulting to file:./dev.db (SQLite under prisma/).");
  process.env.DATABASE_URL = "file:./dev.db";
}

if (process.env.CF_WORKERS_BUILD === "1") {
  console.warn("[env] CF_WORKERS_BUILD=1 is set locally — ignored for `npm run dev`. Only cf-build uses it.");
}
