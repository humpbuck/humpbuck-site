import { createRequire } from "node:module";
import { createLocalFilePrismaClient } from "@/lib/prisma-local";

const require = createRequire(import.meta.url);
(require("../scripts/load-project-env.mjs") as typeof import("../scripts/load-project-env.mjs")).loadProjectEnv();

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "file:./dev.db";
}

/** Standalone scripts (`tsx`, `prisma db seed`) — always local SQLite file, not D1 binding. */
export const prisma = createLocalFilePrismaClient();
