import { execSync } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

// Load `.env` + `.env.local` so local dev/postinstall pick the right generate mode.
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL ?? "";
const useAccelerateGenerate =
  process.env.CF_WORKERS_BUILD === "1" ||
  url.startsWith("prisma://") ||
  url.startsWith("prisma+postgres://");

const args = useAccelerateGenerate ? "generate --no-engine" : "generate";
execSync(`npx prisma ${args}`, { stdio: "inherit" });
