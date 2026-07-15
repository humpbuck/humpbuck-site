import { execSync } from "node:child_process";
import { loadProjectEnv } from "./load-project-env.mjs";
import { purgeNextPrismaCache } from "./purge-next-prisma-cache.mjs";

loadProjectEnv();

execSync("npx prisma generate", { stdio: "inherit" });
purgeNextPrismaCache();
