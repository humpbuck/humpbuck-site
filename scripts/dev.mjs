import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectEnv } from "./load-project-env.mjs";
import { purgeNextPrismaCache } from "./purge-next-prisma-cache.mjs";

loadProjectEnv();

const cwd = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(cwd);

function runPrismaGenerate() {
  execSync("npx prisma generate", { stdio: "inherit" });
  purgeNextPrismaCache(cwd);
}

function applyD1Migrations() {
  const remote = process.env.HUMPBUCK_D1_REMOTE === "1";
  const flag = remote ? "--remote" : "--local";
  console.log(`[dev] Syncing Cloudflare D1 (${flag})…`);
  execSync(`node scripts/d1-apply-migration.mjs ${flag}`, { stdio: "inherit" });
}

function syncPrismaAndDatabase() {
  runPrismaGenerate();
  applyD1Migrations();
}

let nextChild = null;
let shuttingDown = false;

function startNextDev() {
  if (nextChild) {
    nextChild.kill("SIGTERM");
    nextChild = null;
  }
  nextChild = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  nextChild.on("exit", (code, signal) => {
    nextChild = null;
    if (shuttingDown) return;
    if (signal === "SIGTERM") return;
    process.exitCode = code ?? 1;
  });
}

function shutdown() {
  shuttingDown = true;
  if (nextChild) nextChild.kill("SIGTERM");
  process.exit(0);
}

runPrismaGenerate();
applyD1Migrations();
startNextDev();

const schemaPath = path.join(cwd, "prisma", "schema.prisma");
let debounceTimer = null;
let lastMtime = fs.statSync(schemaPath).mtimeMs;

console.log("[dev] Watching prisma/schema.prisma — client regen + Next restart on save.\n");

fs.watch(schemaPath, (eventType) => {
  if (eventType !== "change") return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const mtime = fs.statSync(schemaPath).mtimeMs;
      if (mtime === lastMtime) return;
      lastMtime = mtime;
      console.log("\n[dev] prisma/schema.prisma changed — regenerating Prisma client + D1…\n");
      syncPrismaAndDatabase();
      console.log("[dev] Restarting Next.js…\n");
      startNextDev();
    } catch (err) {
      console.warn("[dev] schema watch:", err instanceof Error ? err.message : err);
    }
  }, 800);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
