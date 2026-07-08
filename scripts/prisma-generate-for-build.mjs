import { execSync } from "node:child_process";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const direct = process.env.DIRECT_DATABASE_URL?.trim();
const url = direct || process.env.DATABASE_URL?.trim() || "";
const cfBuild = process.env.CF_WORKERS_BUILD === "1" && !direct;
const useAccelerateGenerate =
  cfBuild || url.startsWith("prisma://") || url.startsWith("prisma+postgres://");

const args = useAccelerateGenerate ? "generate --no-engine" : "generate";
execSync(`npx prisma ${args}`, { stdio: "inherit" });
