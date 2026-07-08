import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
const useAccelerateGenerate =
  process.env.CF_WORKERS_BUILD === "1" ||
  url.startsWith("prisma://") ||
  url.startsWith("prisma+postgres://");

const args = useAccelerateGenerate ? "generate --no-engine" : "generate";
execSync(`npx prisma ${args}`, { stdio: "inherit" });
